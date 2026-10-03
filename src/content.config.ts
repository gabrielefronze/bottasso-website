import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const link = z.object({
  label: z.string(),
  href: z.string(),
});

const site = defineCollection({
  loader: glob({ pattern: "global.yaml", base: "./src/content/site" }),
  schema: z.object({
    name: z.string(),
    taglineLines: z.array(z.string()),
    portrait: z.string(),
    nav: z.array(link),
    email: z.string(),
    location: z.string(),
    vat: z.string(),
    kvk: z.string(),
    socials: z.array(link),
    copyright: z.string(),
    skipLabel: z.string(),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/news" }),
  schema: z.object({
    date: z.string(),
    dateLabel: z.string(),
    title: z.string(),
    body: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    ctaLabel: z.string(),
    href: z.string(),
    layout: z.enum(["image-right", "image-left"]).default("image-right"),
    extraLinks: z.array(link).default([]),
    order: z.number(),
  }),
});

/**
 * Fields shared by everything rendered as a work card. Descriptions, covers and
 * facts are pulled from the linked asset (see scripts/fetch-link-meta.mjs);
 * `source` points at a different asset than the CTA when needed (e.g. the
 * Bandcamp album behind a Linktree) and `description` overrides the fetched text.
 */
const linked = {
  source: z.string().optional(),
  description: z.string().optional(),
};

const work = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    tags: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    ctaLabel: z.string().optional(),
    href: z.string().optional(),
    order: z.number(),
    ...linked,
  }),
});

const collaborations = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/collaborations" }),
  schema: z.object({
    partner: z.string(),
    works: z.array(link.extend({ ...linked, image: z.string().optional() })),
    order: z.number(),
  }),
});

const soundtracks = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/soundtracks" }),
  schema: z.object({
    title: z.string(),
    href: z.string(),
    credit: z.string(),
    note: z.string(),
    image: z.string().optional(),
    order: z.number(),
    ...linked,
  }),
});

const agenda = defineCollection({
  loader: glob({ pattern: "events.yaml", base: "./src/content/agenda" }),
  schema: z.object({
    upcomingHeading: z.string(),
    pastHeading: z.string(),
    hero: z.string(),
    heroCredit: z.string(),
    upcoming: z.array(
      z.object({
        date: z.string(),
        title: z.string(),
        venue: z.string(),
        city: z.string(),
      }),
    ),
    past: z.array(
      z.object({
        year: z.string(),
        events: z.array(
          z.object({
            title: z.string(),
            venue: z.string(),
            city: z.string(),
          }),
        ),
      }),
    ),
  }),
});

const media = defineCollection({
  loader: glob({ pattern: "gallery.yaml", base: "./src/content/media" }),
  schema: z.object({
    photosHeading: z.string(),
    pressHeading: z.string(),
    pressCredit: z.string(),
    pressDownload: link,
    photos: z.array(
      z.object({
        src: z.string(),
        alt: z.string(),
        caption: z.string(),
        credit: z.string().optional(),
      }),
    ),
    press: z.array(
      z.object({
        src: z.string(),
        alt: z.string(),
      }),
    ),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    portrait: z.string().optional(),
    portraitCredit: z.string().optional(),
    bio: z.string().optional(),
    files: z.array(link).default([]),
    reviews: z
      .array(
        z.object({
          quote: z.string(),
          name: z.string(),
          role: z.string(),
        }),
      )
      .default([]),
    hero: z.string().optional(),
    heroCredit: z.string().optional(),
    intro: z
      .object({
        eyebrow: z.string(),
        image: z.string(),
        imageAlt: z.string(),
        imageCredit: z.string().optional(),
        scrollHint: z.string(),
        ctas: z.array(link).default([]),
      })
      .optional(),
    statement: z.string().optional(),
    labels: z.record(z.string(), z.string()).default({}),
    pressCredit: z.string().optional(),
    pressDownload: link.optional(),
    sections: z
      .object({
        photos: z.string().optional(),
        press: z.string().optional(),
        reviews: z.string().optional(),
        upcoming: z.string().optional(),
        past: z.string().optional(),
        collaborations: z.string().optional(),
        soundtracks: z.string().optional(),
        news: z.string().optional(),
      })
      .optional(),
  }),
});

export const collections = {
  site,
  news,
  work,
  collaborations,
  soundtracks,
  agenda,
  media,
  pages,
};
