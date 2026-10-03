import { getCollection, getEntry } from "astro:content";

export async function getSite() {
  const entry = await getEntry("site", "global");
  if (!entry) throw new Error("Missing src/content/site/global.yaml");
  return entry.data;
}

export function byOrder<T extends { data: { order: number } }>(items: T[]) {
  return [...items].sort((a, b) => a.data.order - b.data.order);
}

export async function getPage(id: string) {
  const entry = await getEntry("pages", id);
  if (!entry) throw new Error(`Missing page content: ${id}`);
  return entry.data;
}

export async function sortedCollection<C extends "news" | "work" | "collaborations" | "soundtracks">(
  name: C,
) {
  return byOrder(await getCollection(name));
}
