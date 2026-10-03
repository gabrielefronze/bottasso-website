/**
 * Helpers for the agenda page: parse the "YYYY.MM.DD" / "YYYY.MM.DD → YYYY.MM.DD"
 * strings used in events.yaml into something people can scan quickly, and build
 * calendar / map links for each date.
 */

export interface AgendaEvent {
  date: string;
  title: string;
  venue: string;
  city: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  /** true when the event spans more than one day */
  multiDay: boolean;
  /** number of days covered, inclusive */
  days: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseOne(text: string): Date | undefined {
  const m = text.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (!m) return undefined;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

export function parseRange(text: string): DateRange | undefined {
  const [a, b] = text.split(/\s*(?:→|->|–|-)\s*(?=\d{4})/);
  const start = parseOne(a);
  if (!start) return undefined;
  const end = (b && parseOne(b)) || start;
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return { start, end, multiDay: days > 1, days };
}

export const day = (d: Date) => String(d.getUTCDate());
export const month = (d: Date) => MONTHS[d.getUTCMonth()];
export const monthLong = (d: Date) => MONTHS_LONG[d.getUTCMonth()];
export const year = (d: Date) => String(d.getUTCFullYear());
export const weekday = (d: Date) => WEEKDAYS[d.getUTCDay()];

/** "28 Nov 2026", "25 → 31 Oct 2026", "29 Apr → 2 May 2027" */
export function formatRange(r: DateRange) {
  if (!r.multiDay) return `${day(r.start)} ${month(r.start)} ${year(r.start)}`;
  if (r.start.getUTCMonth() === r.end.getUTCMonth() && r.start.getUTCFullYear() === r.end.getUTCFullYear()) {
    return `${day(r.start)} → ${day(r.end)} ${month(r.start)} ${year(r.start)}`;
  }
  if (r.start.getUTCFullYear() === r.end.getUTCFullYear()) {
    return `${day(r.start)} ${month(r.start)} → ${day(r.end)} ${month(r.end)} ${year(r.start)}`;
  }
  return `${day(r.start)} ${month(r.start)} ${year(r.start)} → ${day(r.end)} ${month(r.end)} ${year(r.end)}`;
}

/** ISO date for <time datetime>, "2026-11-28" or "2026-10-25/2026-10-31" */
export function isoRange(r: DateRange) {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return r.multiDay ? `${iso(r.start)}/${iso(r.end)}` : iso(r.start);
}

/** Month key for grouping, e.g. "2026-11" */
export const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export interface MonthGroup<T> {
  key: string;
  label: string;
  items: T[];
}

export function groupByMonth<T extends { range?: DateRange }>(items: T[]): MonthGroup<T>[] {
  const groups = new Map<string, MonthGroup<T>>();
  for (const item of items) {
    const d = item.range?.start;
    const key = d ? monthKey(d) : "tba";
    const label = d ? `${monthLong(d)} ${year(d)}` : "to be announced";
    if (!groups.has(key)) groups.set(key, { key, label, items: [] });
    groups.get(key)!.items.push(item);
  }
  return [...groups.values()];
}

/** "Bellinzona, Switzerland" → { place: "Bellinzona", country: "Switzerland" } */
export function splitCity(city: string) {
  const i = city.lastIndexOf(",");
  if (i === -1) return { place: city.trim(), country: undefined };
  return { place: city.slice(0, i).trim(), country: city.slice(i + 1).trim() };
}

export function countries(events: { city: string }[]) {
  const set = new Set<string>();
  for (const e of events) {
    const { country } = splitCity(e.city);
    if (country) set.add(country);
  }
  return set;
}

/** Workshops and lectures read differently from concerts; everything else is a live date. */
export function eventKind(e: { title: string; venue: string }): "workshop" | "lecture" | "live" {
  const text = `${e.title} ${e.venue}`.toLowerCase();
  if (/workshop|masterclass|spielkurs/.test(text)) return "workshop";
  if (/lecture|talk|conference/.test(text)) return "lecture";
  return "live";
}

export function mapsUrl(e: { venue: string; city: string }) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue}, ${e.city}`)}`;
}

/** Inline .ics (all-day event) so the date can be dropped into any calendar. */
export function icsHref(e: AgendaEvent, r: DateRange, site: { name: string; url: string }) {
  const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const endExclusive = new Date(r.end.getTime() + 86400000);
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const uid = `${ymd(r.start)}-${e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}@nicolobottasso.com`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//nicolobottasso.com//agenda//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${ymd(r.start)}T000000Z`,
    `DTSTART;VALUE=DATE:${ymd(r.start)}`,
    `DTEND;VALUE=DATE:${ymd(endExclusive)}`,
    `SUMMARY:${esc(`${e.title} — ${site.name}`)}`,
    `LOCATION:${esc(`${e.venue}, ${e.city}`)}`,
    `URL:${site.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

export function icsFilename(e: AgendaEvent, r: DateRange) {
  return `${r.start.toISOString().slice(0, 10)}-${e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.ics`;
}

/** Fill "{events} dates · {countries} countries" style templates from YAML. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));
}
