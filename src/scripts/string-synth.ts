/*
 * Tiny physical-model synth for the hero strings, voiced like violin
 * pizzicato: a Karplus–Strong string plucked near the fingerboard, a quick
 * thumpy decay, a slight pitch sag on the attack and a violin-body
 * resonance stage. Everything is rendered in the browser; no samples.
 */

export type StringVoice = {
  freq: number;
  ring: number; // seconds until the note has essentially died
  level: number; // relative loudness
};

const MAX_VOICES = 24;
const PLUCK_POSITION = 0.22; // fraction of string length: fingerboard-end pizz

type Active = { src: AudioBufferSourceNode; gain: GainNode };

export class StringSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: GainNode | null = null;
  private active: Active[] = [];
  private cache = new Map<string, AudioBuffer>();
  readonly voices: StringVoice[];
  enabled = false;

  constructor(voices: StringVoice[]) {
    this.voices = voices;
  }

  get ready() {
    return !!this.ctx && this.ctx.state === "running";
  }

  /** Must be called from a user gesture the first time. */
  async enable() {
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    if (ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch {
        /* resume may be blocked until a real gesture */
      }
    }
    this.enabled = true;
    this.master?.gain.cancelScheduledValues(ctx.currentTime);
    this.master?.gain.setTargetAtTime(0.3, ctx.currentTime, 0.25);
  }

  disable() {
    this.enabled = false;
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.12);
  }

  /**
   * @param index   string index (voice)
   * @param force   0..1 pluck strength
   * @param pan     0..1 horizontal position → stereo
   */
  pluck(index: number, force: number, pan: number) {
    if (!this.enabled || !this.ctx || !this.master || !this.wet) return;
    if (this.ctx.state !== "running") return;
    const voice = this.voices[index];
    if (!voice) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const f = Math.min(1, Math.max(0.05, force));
    // firmer pizzicato is a little brighter; quantised so buffers cache well
    const brightness = Math.round((0.08 + f * 0.14) * 32) / 32;
    const buffer = this.render(voice, brightness);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    // pizz attack: the string is displaced, pitch sits sharp and sags back
    const settle = (Math.random() - 0.5) * 10;
    src.detune.setValueAtTime(settle + 14 + f * 24, t);
    src.detune.linearRampToValueAtTime(settle, t + 0.07);

    const gain = ctx.createGain();
    const peak = voice.level * (0.04 + f * 0.2) * (0.8 + Math.random() * 0.4);
    // round off the very first milliseconds so the attack is a thumb, not a nail
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.006);

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-0.8, Math.min(0.8, (pan - 0.5) * 1.5));

    src.connect(gain).connect(panner);
    panner.connect(this.master);
    panner.connect(this.wet);

    src.start();
    src.onended = () => {
      this.active = this.active.filter((a) => a.src !== src);
      src.disconnect();
      gain.disconnect();
      panner.disconnect();
    };
    this.active.push({ src, gain });
    if (this.active.length > MAX_VOICES) {
      // steal the oldest voice with a short fade so it never clicks
      const old = this.active.shift();
      if (old) {
        old.gain.gain.cancelScheduledValues(t);
        old.gain.gain.setValueAtTime(old.gain.gain.value, t);
        old.gain.gain.linearRampToValueAtTime(0, t + 0.08);
        try {
          old.src.stop(t + 0.09);
        } catch {
          /* already stopped */
        }
      }
    }
  }

  private build() {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;

    // violin body: air resonance, main wood resonance, a little nasal bump
    const body = [
      this.peak(ctx, 275, 3.5, 7),
      this.peak(ctx, 460, 3, 4.5),
      this.peak(ctx, 1050, 2, 0.5),
    ];

    // felt-muted: two gentle low-pass stages, nothing wiry survives
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 1500;
    tone.Q.value = 0.5;

    const tone2 = ctx.createBiquadFilter();
    tone2.type = "lowpass";
    tone2.frequency.value = 2400;
    tone2.Q.value = 0.4;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 3;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;

    master
      .connect(body[0])
      .connect(body[1])
      .connect(body[2])
      .connect(tone)
      .connect(tone2)
      .connect(comp)
      .connect(ctx.destination);
    this.master = master;

    // room: synthetic impulse response → convolver → master
    const wet = ctx.createGain();
    wet.gain.value = 0.6;
    const verb = ctx.createConvolver();
    verb.buffer = this.impulse(ctx, 3, 2.4);
    wet.connect(verb).connect(master);
    this.wet = wet;
  }

  private peak(ctx: AudioContext, frequency: number, q: number, gain: number) {
    const node = ctx.createBiquadFilter();
    node.type = "peaking";
    node.frequency.value = frequency;
    node.Q.value = q;
    node.gain.value = gain;
    return node;
  }

  private impulse(ctx: AudioContext, seconds: number, decay: number) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (1 - Math.exp(-i / 400));
      }
    }
    return buffer;
  }

  private render(voice: StringVoice, brightness: number) {
    const key = `${voice.freq}|${brightness}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const period = Math.max(2, Math.round(rate / voice.freq));
    const length = Math.floor(rate * voice.ring * 1.15);
    const buffer = ctx.createBuffer(1, length, rate);
    const out = buffer.getChannelData(0);

    // loop gain so the note has decayed ~ -30 dB after `ring` seconds
    const damping = Math.exp(Math.log(0.03) / (voice.freq * voice.ring));

    // excitation: soft finger (low-passed noise), then a pluck-position comb
    // which hollows the tone the way a fingerboard-end pizzicato does
    const raw = new Float32Array(period);
    let lp = 0;
    for (let i = 0; i < period; i++) {
      const n = Math.random() * 2 - 1;
      lp += brightness * (n - lp);
      raw[i] = lp;
    }
    const offset = Math.max(1, Math.round(period * PLUCK_POSITION));
    const line = new Float32Array(period);
    let sum = 0;
    for (let i = 0; i < period; i++) {
      line[i] = raw[i] - raw[(i + period - offset) % period];
      sum += line[i];
    }
    const mean = sum / period;
    for (let i = 0; i < period; i++) line[i] -= mean;

    // Karplus–Strong loop with a one-pole damping average
    let idx = 0;
    const fade = Math.floor(rate * 0.12);
    for (let i = 0; i < length; i++) {
      const cur = line[idx];
      const next = line[(idx + 1) % period];
      out[i] = cur;
      line[idx] = damping * 0.5 * (cur + next);
      idx = (idx + 1) % period;
    }
    for (let i = 0; i < fade; i++) out[length - 1 - i] *= i / fade;

    this.cache.set(key, buffer);
    return buffer;
  }
}
