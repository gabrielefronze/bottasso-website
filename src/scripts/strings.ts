/*
 * The resonating strings: a canvas with 5 bowed + 7 sympathetic strings
 * (like a tenore d’amore) that hum on their own, answer the pointer, and
 * optionally sound through the Karplus–Strong synth. Used by the homepage
 * hero and, more quietly, by the title band of the inner pages.
 */

import { StringSynth, type StringVoice } from "./string-synth";

export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Open D tuning for the 5 bowed strings, a D-major scale for the
// 7 sympathetic ones: whatever the cursor rakes across stays consonant.
// `ring` is how long each pizzicato lasts: low strings thump longer,
// high ones die quickly, sympathetic ones are just a short halo.
const VOICES: StringVoice[] = [
  { freq: 146.83, ring: 1.7, level: 1 }, // D3
  { freq: 220.0, ring: 1.4, level: 0.95 }, // A3
  { freq: 293.66, ring: 1.1, level: 0.9 }, // D4
  { freq: 369.99, ring: 0.95, level: 0.85 }, // F#4
  { freq: 440.0, ring: 0.8, level: 0.8 }, // A4
  { freq: 293.66, ring: 0.7, level: 0.42 }, // D4
  { freq: 329.63, ring: 0.65, level: 0.42 }, // E4
  { freq: 369.99, ring: 0.6, level: 0.4 }, // F#4
  { freq: 392.0, ring: 0.6, level: 0.4 }, // G4
  { freq: 440.0, ring: 0.55, level: 0.38 }, // A4
  { freq: 493.88, ring: 0.5, level: 0.36 }, // B4
  { freq: 587.33, ring: 0.45, level: 0.34 }, // D5
];

const SOUND_KEY = "strings-sound";
export const synth = new StringSynth(VOICES);

/* ------------------------------------------------------------------ */
/* sound toggle                                                        */
/* ------------------------------------------------------------------ */

/**
 * Wires a `[data-sound-toggle]` button inside `host`. The preference is
 * shared across pages through localStorage, so once the visitor turns the
 * sound on it follows them to the inner pages.
 */
export function mountSound(host: HTMLElement) {
  const toggle = host.querySelector<HTMLButtonElement>("[data-sound-toggle]");
  if (!toggle || reduceMotion) {
    toggle?.remove();
    return;
  }
  const label = toggle.querySelector<HTMLElement>(".sound-label");
  const setUI = (on: boolean) => {
    toggle.classList.toggle("is-on", on);
    toggle.setAttribute("aria-pressed", String(on));
    if (label) label.textContent = on ? label.dataset.on ?? "" : label.dataset.off ?? "";
  };

  const wantsSound = localStorage.getItem(SOUND_KEY) === "on";
  setUI(wantsSound);

  const armOnGesture = () => {
    // browsers only let audio start from a real gesture
    const resume = () => {
      if (localStorage.getItem(SOUND_KEY) === "on") synth.enable();
    };
    window.addEventListener("pointerdown", resume, { once: true, passive: true });
    window.addEventListener("keydown", resume, { once: true });
  };
  if (wantsSound) armOnGesture();

  toggle.addEventListener("click", async () => {
    const on = !toggle.classList.contains("is-on");
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    setUI(on);
    if (on) {
      await synth.enable();
      // a soft open chord so the user hears it worked
      [0, 1, 2].forEach((i, k) => window.setTimeout(() => synth.pluck(i, 0.25, 0.3 + k * 0.2), k * 140));
    } else {
      synth.disable();
    }
  });
}

/* ------------------------------------------------------------------ */
/* strings                                                             */
/* ------------------------------------------------------------------ */

type Pluck = { x: number; born: number; amp: number; freq: number; spread: number };

type StringModel = {
  y0: number; // left end (fraction of height)
  y1: number; // right end
  thickness: number;
  alpha: number;
  phase: number;
  idle: number;
  freqBase: number;
  plucks: Pluck[];
};

export interface StringsOptions {
  /** overall line opacity multiplier (1 on the homepage, lower on inner pages) */
  alpha?: number;
  /** how hard the self-plucks hit the synth (0–1) */
  autoGain?: number;
  /** average pause between self-plucks, ms */
  autoInterval?: number;
}

function buildStrings(alphaScale: number): StringModel[] {
  const out: StringModel[] = [];
  // 5 bowed strings: thicker, lower pitch (slower vibration)
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    out.push({
      y0: 0.3 + t * 0.42,
      y1: 0.22 + t * 0.56,
      thickness: 1.6 - t * 0.5,
      alpha: 0.55 * alphaScale,
      phase: Math.random() * Math.PI * 2,
      idle: 2.2 + t * 0.8,
      freqBase: 2.4 + t * 1.1,
      plucks: [],
    });
  }
  // 7 sympathetic strings: hairline, higher pitch, respond to neighbours
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    out.push({
      y0: 0.2 + t * 0.6,
      y1: 0.34 + t * 0.4,
      thickness: 0.6,
      alpha: 0.32 * alphaScale,
      phase: Math.random() * Math.PI * 2,
      idle: 1.2 + t * 0.5,
      freqBase: 4.5 + t * 2,
      plucks: [],
    });
  }
  return out;
}

export function mountStrings(host: HTMLElement, canvas: HTMLCanvasElement, options: StringsOptions = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { alpha: alphaScale = 1, autoGain = 0.5, autoInterval = 2200 } = options;
  const strings = buildStrings(alphaScale);
  let width = 0;
  let height = 0;
  let dpr = 1;
  let visible = true;
  let raf = 0;
  let inkColor = "#292929";
  let tealColor = "#13607e";
  let frame = 0;
  let lastPointer: { x: number; y: number; t: number } | null = null;
  let nextAuto = performance.now() + 1800;

  const readColors = () => {
    const styles = getComputedStyle(document.documentElement);
    inkColor = styles.getPropertyValue("--ink").trim() || inkColor;
    tealColor = styles.getPropertyValue("--teal").trim() || tealColor;
  };

  const resize = () => {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduceMotion) draw(performance.now());
  };

  const stringY = (s: StringModel, x: number) => {
    const t = x / width;
    return (s.y0 + (s.y1 - s.y0) * t) * height;
  };

  const pluck = (index: number, x: number, amp: number, now: number, sympathetic = true, gain = 1) => {
    const s = strings[index];
    if (!s) return;
    synth.pluck(index, (amp / 30) * gain, x / Math.max(width, 1));
    s.plucks.push({
      x,
      born: now,
      amp,
      freq: s.freqBase * (0.9 + Math.random() * 0.2),
      spread: 60 + Math.random() * 60,
    });
    if (s.plucks.length > 6) s.plucks.shift();
    if (!sympathetic) return;
    // resonance: the sympathetic strings answer a little later, softer
    const partners = index < 5 ? [5 + index, 6 + index, 11 - index] : [index - 1, index + 1];
    for (const p of partners) {
      if (p < 0 || p >= strings.length || p === index) continue;
      window.setTimeout(
        () => pluck(p, x + (Math.random() - 0.5) * 120, amp * 0.3, performance.now(), false, 0.6),
        90 + Math.random() * 120,
      );
    }
  };

  const draw = (now: number) => {
    ctx.clearRect(0, 0, width, height);
    const time = now / 1000;
    const step = 6;

    for (let i = 0; i < strings.length; i++) {
      const s = strings[i];
      // prune dead plucks
      s.plucks = s.plucks.filter((p) => now - p.born < 6000);

      let energy = 0;
      for (const p of s.plucks) energy += Math.abs(p.amp) * Math.exp(-(now - p.born) / 1400);

      ctx.beginPath();
      for (let x = 0; x <= width + step; x += step) {
        const xr = Math.min(x, width);
        const pin = Math.sin((Math.PI * xr) / width); // fixed ends
        let y = stringY(s, xr);
        if (!reduceMotion) {
          y += Math.sin(xr * 0.0045 + time * 0.55 + s.phase) * s.idle * pin;
          for (const p of s.plucks) {
            const age = (now - p.born) / 1000;
            const env = Math.exp(-age * 1.35);
            const spread = p.spread + age * 420;
            const local = Math.exp(-((xr - p.x) * (xr - p.x)) / (2 * spread * spread));
            y += p.amp * env * Math.sin(age * p.freq * Math.PI * 2) * local * pin;
          }
        }
        if (x === 0) ctx.moveTo(xr, y);
        else ctx.lineTo(xr, y);
      }

      const glow = Math.min(energy / 10, 1);
      ctx.lineWidth = s.thickness + glow * 0.8;
      ctx.strokeStyle = inkColor;
      ctx.globalAlpha = s.alpha + glow * 0.4 * alphaScale;
      if (glow > 0.15) {
        ctx.shadowColor = tealColor;
        ctx.shadowBlur = 6 + glow * 22;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  };

  const loop = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    if (++frame % 12 === 0) readColors();
    if (now > nextAuto) {
      // the instrument hums on its own: random strings, random timing,
      // sometimes a single note, sometimes a loose little cluster
      const count = Math.random() < 0.3 ? 2 + Math.floor(Math.random() * 2) : 1;
      for (let k = 0; k < count; k++) {
        const idx = Math.floor(Math.random() * strings.length);
        const force = 4 + Math.random() * 10;
        const px = width * (0.15 + Math.random() * 0.7);
        const delay = k === 0 ? 0 : 120 + Math.random() * 480;
        window.setTimeout(() => pluck(idx, px, force, performance.now(), true, autoGain), delay);
      }
      nextAuto = now + autoInterval * (0.4 + Math.random() * 1.2);
    }
    draw(now);
    raf = requestAnimationFrame(loop);
  };

  const start = () => {
    if (reduceMotion) {
      draw(performance.now());
      return;
    }
    if (!raf) raf = requestAnimationFrame(loop);
  };

  host.addEventListener("pointermove", (event) => {
    if (reduceMotion) return;
    const rect = host.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const now = performance.now();
    if (lastPointer) {
      const dt = Math.max(now - lastPointer.t, 1);
      const speed = Math.hypot(x - lastPointer.x, y - lastPointer.y) / dt; // px per ms
      for (let i = 0; i < strings.length; i++) {
        const s = strings[i];
        const before = lastPointer.y - stringY(s, lastPointer.x);
        const after = y - stringY(s, x);
        if ((before < 0 && after >= 0) || (before > 0 && after <= 0)) {
          const amp = Math.min(6 + speed * 14, 30) * (i < 5 ? 1 : 0.7);
          pluck(i, x, amp, now);
        }
      }
    }
    lastPointer = { x, y, t: now };
  });

  host.addEventListener("pointerleave", () => {
    lastPointer = null;
  });

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    },
    { threshold: 0.02 },
  );
  observer.observe(host);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) start();
  });
  new ResizeObserver(resize).observe(host);

  readColors();
  resize();
  start();
}
