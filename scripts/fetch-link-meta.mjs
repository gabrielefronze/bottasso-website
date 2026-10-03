#!/usr/bin/env node
/*
 * Collects every external link in the work / collaborations / soundtracks
 * YAML, asks the linked asset about itself (Vimeo + YouTube oEmbed, Open
 * Graph tags for everything else), downloads the cover image into
 * public/images/linked/ and writes src/data/link-meta.json.
 *
 *   npm run links:meta            refresh stale entries (older than 30 days)
 *   npm run links:meta -- --force refetch everything
 */
import { readdir, readFile, writeFile, mkdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = ["work", "collaborations", "soundtracks"].map((d) => path.join(ROOT, "src/content", d));
const OUT = path.join(ROOT, "src/data/link-meta.json");
const IMG_DIR = path.join(ROOT, "public/images/linked");
const FORCE = process.argv.includes("--force");
const MAX_AGE = 30 * 24 * 3600 * 1000;
const UA = "Mozilla/5.0 (compatible; nicolobottasso.com link preview; +https://www.nicolobottasso.com)";

/* ---------- gather links ---------- */

async function collectLinks() {
  const links = new Set();
  for (const dir of CONTENT) {
    for (const file of await readdir(dir)) {
      if (!file.endsWith(".yaml")) continue;
      const data = yaml.parse(await readFile(path.join(dir, file), "utf8"));
      if (data?.href) links.add(data.href);
      if (data?.source) links.add(data.source);
      for (const w of data?.works ?? []) {
        if (w?.href) links.add(w.href);
        if (w?.source) links.add(w.source);
      }
    }
  }
  return [...links];
}

/* ---------- helpers ---------- */

async function get(url, accept = "text/html,*/*") {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept, "accept-language": "en,it;q=0.8" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res;
}

function decode(text = "") {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function stripTags(html = "") {
  return decode(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""));
}

function isoDate(value) {
  if (!value) return undefined;
  const t = Date.parse(value);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString().slice(0, 10);
}

/** First meaningful paragraphs of the page body, used when there is no og:description. */
function bodyText(html) {
  const paragraphs = [];
  for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = stripTags(m[1]);
    if (text.length < 60) continue;
    if (/cookie|newsletter|privacy|©|copyright/i.test(text)) continue;
    paragraphs.push(text);
    if (paragraphs.join(" ").length > 900) break;
  }
  return paragraphs.length ? paragraphs.join("\n\n") : undefined;
}

/** First sizeable content image on the page (usually the poster), used when there is no og:image. */
function bodyImage(html, base) {
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src || /logo|icon|avatar|sprite|pixel|\.svg|\.gif/i.test(src)) continue;
    const w = Number(tag.match(/\bwidth=["']?(\d+)/i)?.[1] ?? 0);
    const h = Number(tag.match(/\bheight=["']?(\d+)/i)?.[1] ?? 0);
    if (w * h < 400 * 300) continue;
    try {
      return new URL(src, base).href;
    } catch {
      continue;
    }
  }
  return undefined;
}

function meta(html, name) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
    "i",
  );
  const m = html.match(re);
  return m ? decode(m[1] ?? m[2]) : undefined;
}

function host(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

/* ---------- providers ---------- */

async function vimeo(url) {
  const res = await get(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1280`, "application/json");
  const d = await res.json();
  return {
    provider: "vimeo",
    title: d.title,
    description: d.description,
    image: d.thumbnail_url?.replace(/-d_\d+(x\d+)?$/, "-d_1280"),
    author: d.author_name,
    duration: d.duration,
    date: d.upload_date?.slice(0, 10),
  };
}

async function youtube(url) {
  const out = { provider: "youtube" };
  try {
    const res = await get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, "application/json");
    const d = await res.json();
    out.title = d.title;
    out.author = d.author_name;
    out.image = d.thumbnail_url?.replace("hqdefault", "maxresdefault");
  } catch {
    /* fall through to the page */
  }
  try {
    const html = await (await get(url)).text();
    out.title ??= meta(html, "og:title");
    out.image ??= meta(html, "og:image");
    const short = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
    if (short) out.description = JSON.parse(`"${short[1]}"`);
    out.description ??= meta(html, "og:description") ?? meta(html, "description");
    const date = html.match(/"publishDate":"([^"]+)"/) ?? html.match(/"uploadDate":"([^"]+)"/);
    if (date) out.date = date[1].slice(0, 10);
    const dur = html.match(/"lengthSeconds":"(\d+)"/);
    if (dur) out.duration = Number(dur[1]);
  } catch {
    /* oEmbed data is enough */
  }
  return out;
}

/** Fetch a page; if the host refuses us, fall back to the Wayback Machine snapshot. */
async function page(url) {
  try {
    const res = await get(url);
    return { html: await res.text(), base: res.url || url, archived: false };
  } catch (err) {
    const res = await get(`https://web.archive.org/web/2025id_/${url}`);
    console.warn(`  ${url}: ${err.message} → using Wayback snapshot`);
    return { html: await res.text(), base: url, archived: true };
  }
}

function isoDuration(value) {
  if (typeof value !== "string") return undefined;
  const m = value.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
  if (!m) return undefined;
  return Math.round((+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0));
}

async function openGraph(url) {
  const { html, base, archived } = await page(url);
  const h = host(url);
  const title = meta(html, "og:title") ?? decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]);
  let description = meta(html, "og:description") ?? meta(html, "description");
  // A description identical to the title (or a Bandcamp "5 track album") is not worth showing.
  if (!description || description === title || /^\d+ track album$|^track by /i.test(description)) {
    description = bodyText(html) ?? description;
  }
  const out = {
    provider: h.includes("bandcamp") ? "bandcamp" : h === "linktr.ee" ? "linktree" : h === "lnk.to" ? "lnk.to" : "web",
    title,
    description,
    image: meta(html, "og:image") ?? meta(html, "twitter:image") ?? bodyImage(html, base),
    site: meta(html, "og:site_name"),
    archived: archived || undefined,
  };
  if (out.provider === "bandcamp") {
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (ld) {
      try {
        const j = JSON.parse(ld[1]);
        out.date = isoDate(j.datePublished);
        out.author = j.byArtist?.name ?? j.publisher?.name;
        if (typeof j.description === "string" && j.description.trim()) out.description = decode(j.description);
        const items = j.track?.itemListElement;
        if (Array.isArray(items)) {
          out.tracks = items.length;
          out.tracklist = items.map((t) => t.item?.name).filter(Boolean);
          const total = items.reduce((s, t) => s + (isoDuration(t.item?.duration) ?? 0), 0);
          if (total) out.duration = total;
        }
        out.duration ??= isoDuration(j.duration);
      } catch {
        /* ignore malformed JSON-LD */
      }
    }
  }
  return out;
}

async function describe(url) {
  const h = host(url);
  if (h === "vimeo.com" || h === "player.vimeo.com") return vimeo(url);
  if (h === "youtu.be" || h.endsWith("youtube.com")) return youtube(url);
  return openGraph(url);
}

/* ---------- images ---------- */

async function download(imageUrl, key) {
  if (!imageUrl) return undefined;
  let res;
  try {
    res = await get(imageUrl, "image/*");
  } catch {
    res = await get(`https://web.archive.org/web/2025id_/${imageUrl}`, "image/*");
  }
  const type = res.headers.get("content-type") ?? "";
  const ext = type.includes("png") ? ".png" : type.includes("webp") ? ".webp" : ".jpg";
  const file = `${key}${ext}`;
  await mkdir(IMG_DIR, { recursive: true });
  await writeFile(path.join(IMG_DIR, file), Buffer.from(await res.arrayBuffer()));
  return `/images/linked/${file}`;
}

/* ---------- main ---------- */

let existing = {};
try {
  existing = JSON.parse(await readFile(OUT, "utf8"));
} catch {
  /* first run */
}

const links = await collectLinks();
const result = {};
for (const url of links) {
  const prev = existing[url];
  const fresh = prev && !FORCE && Date.now() - Date.parse(prev.fetchedAt) < MAX_AGE;
  let imageExists = false;
  if (prev?.image) {
    try {
      await access(path.join(ROOT, "public", prev.image));
      imageExists = true;
    } catch {
      /* missing on disk */
    }
  }
  if (fresh && (imageExists || !prev.image)) {
    result[url] = prev;
    console.log(`fresh  ${url}`);
    continue;
  }
  try {
    const info = await describe(url);
    const key = createHash("sha1").update(url).digest("hex").slice(0, 12);
    let image;
    try {
      image = await download(info.image, key);
    } catch (err) {
      console.warn(`  image failed for ${url}: ${err.message}`);
    }
    result[url] = {
      ...info,
      image,
      sourceImage: info.image,
      fetchedAt: new Date().toISOString(),
    };
    console.log(`fetched ${url} → ${info.title ?? "(no title)"}`);
  } catch (err) {
    console.warn(`failed ${url}: ${err.message}`);
    if (prev) result[url] = prev;
  }
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(result, null, 2) + "\n");
console.log(`link meta: ${Object.keys(result).length} entries → ${path.relative(ROOT, OUT)}`);
