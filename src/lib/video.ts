/**
 * Turn a public video page URL into an embeddable player URL.
 * Supports Vimeo (including unlisted `/id/hash` links) and YouTube.
 * Returns null for anything else so callers can fall back to a plain link.
 */
export function videoEmbed(href?: string): { provider: "vimeo" | "youtube"; src: string } | null {
  if (!href) return null;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const [, id, hash] = url.pathname.match(/\/(?:video\/)?(\d+)(?:\/([a-z0-9]+))?/i) ?? [];
    if (!id) return null;
    const params = new URLSearchParams({
      autoplay: "1",
      title: "0",
      byline: "0",
      portrait: "0",
      dnt: "1",
      transparent: "0",
      color: "13607e",
    });
    if (hash) params.set("h", hash);
    return { provider: "vimeo", src: `https://player.vimeo.com/video/${id}?${params}` };
  }

  if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
    let id = "";
    if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
    else if (url.pathname.startsWith("/live/") || url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/"))
      id = url.pathname.split("/")[2] ?? "";
    else id = url.searchParams.get("v") ?? "";
    if (!id) return null;
    const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1" });
    const t = url.searchParams.get("t");
    if (t) params.set("start", String(parseInt(t, 10) || 0));
    return { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}?${params}` };
  }

  return null;
}
