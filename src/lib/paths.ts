const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

/** Prefix a site-root path with Astro `base` (needed on GitHub project Pages). */
export function withBase(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  return `${base}${path}`;
}

/** Pathname relative to `base`, so `/work` matches nav items in YAML. */
export function pagePath(pathname: string) {
  let path = pathname.replace(/\/$/, "") || "/";
  if (base && (path === base || path.startsWith(`${base}/`))) {
    path = path.slice(base.length) || "/";
  }
  return path;
}
