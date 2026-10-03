#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INPUT_DIR = path.join(ROOT, "public", "images");
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const MAX_EDGE = 2000;
const QUALITY = 80;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

async function convert(file) {
  const ext = path.extname(file).toLowerCase();
  if (!EXTENSIONS.has(ext)) return { file, status: "skip" };

  const dest = file.slice(0, -ext.length) + ".webp";
  const srcStat = await stat(file);
  try {
    const destStat = await stat(dest);
    if (destStat.mtimeMs >= srcStat.mtimeMs) return { file, dest, status: "fresh" };
  } catch {
    // dest missing
  }

  await sharp(file)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(dest);

  const outStat = await stat(dest);
  return {
    file,
    dest,
    status: "wrote",
    from: srcStat.size,
    to: outStat.size,
  };
}

const files = await walk(INPUT_DIR);
const results = [];
for (const file of files) {
  results.push(await convert(file));
}

const wrote = results.filter((r) => r.status === "wrote");
const fresh = results.filter((r) => r.status === "fresh");
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

for (const item of wrote) {
  const rel = path.relative(ROOT, item.dest);
  console.log(`wrote ${rel} (${kb(item.from)} → ${kb(item.to)})`);
}

console.log(
  `webp: ${wrote.length} converted, ${fresh.length} up to date, ${results.length} sources scanned`,
);
