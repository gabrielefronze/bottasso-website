import raw from "../data/link-meta.json";

/** Shape of one entry in src/data/link-meta.json (written by scripts/fetch-link-meta.mjs). */
export interface LinkMeta {
  provider: "vimeo" | "youtube" | "bandcamp" | "linktree" | "lnk.to" | "web";
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  site?: string;
  /** seconds */
  duration?: number;
  /** ISO date (YYYY-MM-DD) */
  date?: string;
  tracks?: number;
  tracklist?: string[];
  archived?: boolean;
  sourceImage?: string;
  fetchedAt: string;
}

const META = raw as Record<string, LinkMeta>;

/** Hub pages whose descriptions are boilerplate rather than about the work. */
const HUBS = new Set<LinkMeta["provider"]>(["linktree", "lnk.to"]);

export function linkMeta(href?: string): LinkMeta | undefined {
  if (!href) return undefined;
  return META[href];
}

const URL_RE = /https?:\/\/\S+/g;
const TIMESTAMP_RE = /^\d{1,2}:\d{2}(?::\d{2})?\b/;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** "Organetto: Simone Bottasso", "Andrea Leone - tenor sax", "Sound - Philip ten Brink"… */
function isCreditLine(line: string) {
  const colon = line.indexOf(":");
  if (colon > 0 && words(line.slice(0, colon)) <= 5 && words(line) <= 16) return true;
  if (/\s[-–—]\s/.test(line) && words(line) <= 7 && !/[.!?]$/.test(line)) return true;
  return false;
}

/** A paragraph that reads like prose rather than a header or a list. */
const isProse = (p: string) => /[.!?]/.test(p) && words(p) >= 15;

/**
 * Turn a raw description scraped from a video or album page into a short,
 * readable blurb: drop URLs, timestamps and credit lines, prefer the first
 * paragraph that reads like prose, then cut at a sentence boundary around
 * `max` characters.
 */
export function cleanDescription(text?: string, max = 360): string | undefined {
  if (!text) return undefined;
  const paragraphs = text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((p) =>
      p
        .split("\n")
        .map((line) => line.replace(URL_RE, "").trim())
        .filter((line) => line && !TIMESTAMP_RE.test(line) && !/^[-–—\s]+$/.test(line) && !isCreditLine(line))
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim(),
    )
    .filter((p) => words(p) >= 8);

  if (!paragraphs.length) return undefined;

  const start = paragraphs.findIndex(isProse);
  // No real prose anywhere: show just the opening line rather than a pile of credits.
  let out = start === -1 ? paragraphs[0] : paragraphs[start];
  for (const p of paragraphs.slice(start + 1)) {
    if (start === -1 || out.length >= max * 0.6) break;
    out = `${out} ${p}`;
  }
  if (out.length <= max) return out;

  const cut = out.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentence > max * 0.45) return cut.slice(0, sentence + 1);
  const word = cut.lastIndexOf(" ");
  return `${cut.slice(0, word > 0 ? word : max).replace(/[,;:\s]+$/, "")}…`;
}

/** Description for a card, honouring YAML overrides and ignoring hub boilerplate. */
export function describe(override?: string, ...hrefs: (string | undefined)[]) {
  if (override) return override;
  for (const href of hrefs) {
    const meta = linkMeta(href);
    if (!meta || HUBS.has(meta.provider)) continue;
    const text = cleanDescription(meta.description);
    if (text) return text;
  }
  return undefined;
}

export function formatDuration(seconds?: number) {
  if (!seconds) return undefined;
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return `${seconds} s`;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function providerLabel(meta?: LinkMeta, href?: string) {
  switch (meta?.provider) {
    case "vimeo":
      return "Vimeo";
    case "youtube":
      return "YouTube";
    case "bandcamp":
      return "Bandcamp";
    case "linktree":
      return "Linktree";
    case "lnk.to":
      return "streaming";
    default:
      if (!href) return undefined;
      try {
        return new URL(href).hostname.replace(/^www\./, "");
      } catch {
        return undefined;
      }
  }
}

/** What kind of thing the link points at, for the small badge on the card. */
export function assetKind(meta?: LinkMeta): string | undefined {
  if (!meta) return undefined;
  switch (meta.provider) {
    case "vimeo":
    case "youtube":
      return "video";
    case "bandcamp":
      return meta.tracks && meta.tracks > 1 ? "album" : "track";
    case "lnk.to":
      return "release";
    case "linktree":
      return "links";
    default:
      return "website";
  }
}

export function year(meta?: LinkMeta) {
  return meta?.date?.slice(0, 4);
}

/** Compact fact list shown under the title: "video · 49 min · 2023". */
export function facts(meta?: LinkMeta): string[] {
  if (!meta) return [];
  const out: string[] = [];
  const kind = assetKind(meta);
  if (kind) out.push(kind);
  if (meta.tracks && meta.tracks > 1) out.push(`${meta.tracks} tracks`);
  const dur = formatDuration(meta.duration);
  if (dur) out.push(dur);
  const y = year(meta);
  if (y) out.push(y);
  return out;
}
