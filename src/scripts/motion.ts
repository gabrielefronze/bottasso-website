function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function revealInView() {
  const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("is-pending");
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  nodes.forEach((node, index) => {
    const rect = node.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (onScreen) {
      node.classList.add("is-in");
      return;
    }
    node.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
    node.classList.add("is-pending");
    observer.observe(node);
  });
}

function compactHeader() {
  const header = document.querySelector(".site-chrome");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("is-compact", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function mobileNav() {
  const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
  const nav = document.querySelector(".nav");
  toggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(Boolean(open)));
    document.body.style.overflow = open ? "hidden" : "";
  });
  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });
}

function syncThemeToggle(theme: "dark" | "light") {
  const toggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (!toggle) return;
  toggle.setAttribute(
    "aria-label",
    theme === "light" ? "Switch to dark theme" : "Switch to light theme",
  );
}

function applyTheme(theme: "dark" | "light", persist = true) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  if (persist) localStorage.setItem("theme", theme);
  const color = getComputedStyle(root).getPropertyValue("--theme-color").trim();
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", color || (theme === "light" ? "#ffffff" : "#121212"));
  syncThemeToggle(theme);
}

function themeSwitch() {
  const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  applyTheme(current, false);
  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next, true);
  });
}

document.documentElement.classList.add("js");
compactHeader();
mobileNav();
themeSwitch();
revealInView();
