/*
 * Homepage motion:
 *  - resonating strings canvas (shared with the inner pages, see strings.ts)
 *  - pointer spotlight, portrait tilt, variable-weight letters near the cursor
 *  - scroll-driven word lighting for statement / quote
 *  - magnetic CTAs
 */

import { mountSound, mountStrings, reduceMotion } from "./strings";

const finePointer = window.matchMedia("(pointer: fine)").matches;

/* ------------------------------------------------------------------ */
/* pointer effects: spotlight, tilt, variable-weight letters            */
/* ------------------------------------------------------------------ */

function initPointer(hero: HTMLElement) {
  const figure = hero.querySelector<HTMLElement>("[data-tilt]");
  const letters = Array.from(hero.querySelectorAll<HTMLElement>(".hero-title .ch"));
  let centers: { el: HTMLElement; x: number; y: number }[] = [];
  let measured = 0;

  const measure = () => {
    centers = letters.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    measured = performance.now();
  };

  hero.addEventListener("pointerenter", () => hero.classList.add("is-hover"));
  hero.addEventListener("pointerleave", () => {
    hero.classList.remove("is-hover");
    figure?.style.setProperty("--rx", "0deg");
    figure?.style.setProperty("--ry", "0deg");
    for (const l of letters) l.style.fontVariationSettings = '"wght" 300';
  });

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    hero.style.setProperty("--my", `${event.clientY - rect.top}px`);

    if (reduceMotion) return;

    if (figure) {
      const fr = figure.getBoundingClientRect();
      const dx = (event.clientX - (fr.left + fr.width / 2)) / fr.width;
      const dy = (event.clientY - (fr.top + fr.height / 2)) / fr.height;
      const near = Math.abs(dx) < 1.4 && Math.abs(dy) < 1.4;
      figure.style.setProperty("--ry", `${near ? dx * 6 : 0}deg`);
      figure.style.setProperty("--rx", `${near ? -dy * 6 : 0}deg`);
    }

    if (finePointer && letters.length) {
      if (performance.now() - measured > 800) measure();
      for (const c of centers) {
        const d = Math.hypot(event.clientX - c.x, event.clientY - c.y);
        const k = Math.max(0, 1 - d / 240);
        const wght = Math.round(300 + 450 * k * k);
        c.el.style.fontVariationSettings = `"wght" ${wght}`;
      }
    }
  });

  window.addEventListener("resize", () => (measured = 0), { passive: true });
}

/* ------------------------------------------------------------------ */
/* scroll-lit words                                                    */
/* ------------------------------------------------------------------ */

function initWords() {
  const blocks = Array.from(document.querySelectorAll<HTMLElement>("[data-words]"));
  if (!blocks.length) return;
  if (reduceMotion) {
    blocks.forEach((b) => b.style.setProperty("--p", "1"));
    return;
  }
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      const start = vh * 0.88; // block top reaches here → 0
      const end = vh * 0.42; // block bottom reaches here → 1
      const raw = (start - rect.top) / (rect.height + start - end);
      const p = Math.min(1, Math.max(0, raw));
      block.style.setProperty("--p", p.toFixed(3));
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}

/* ------------------------------------------------------------------ */
/* magnetic buttons                                                    */
/* ------------------------------------------------------------------ */

function initMagnets() {
  if (reduceMotion || !finePointer) return;
  for (const el of document.querySelectorAll<HTMLElement>(".magnet")) {
    const inner = el.querySelector<HTMLElement>("span");
    el.addEventListener("pointermove", (event) => {
      const r = el.getBoundingClientRect();
      const dx = event.clientX - (r.left + r.width / 2);
      const dy = event.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.28}px)`;
      if (inner) inner.style.transform = `translate(${dx * 0.1}px, ${dy * 0.12}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
      if (inner) inner.style.transform = "";
    });
  }
}

/* ------------------------------------------------------------------ */

const hero = document.querySelector<HTMLElement>(".hero");
const canvas = document.querySelector<HTMLCanvasElement>("[data-strings]");
if (hero && canvas) {
  mountStrings(hero, canvas);
  initPointer(hero);
  mountSound(hero);
}
initWords();
initMagnets();
