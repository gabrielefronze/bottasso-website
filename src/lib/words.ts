function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Wrap every word in a `<span class="w" style="--i">` so CSS can light
 * words up one by one. `**bold**` segments become `<strong>`.
 * Pieces glued together without whitespace (e.g. `**timbre**,`) are kept
 * in a no-break wrapper so punctuation never wraps onto its own line.
 * Returns the markup and the word count (exposed as `--n`).
 */
export function splitWords(text: string) {
  let index = 0;
  let bold = false;
  const chunks: string[] = [];
  let chunk: string[] = [];

  const flush = () => {
    if (!chunk.length) return;
    chunks.push(chunk.length > 1 ? `<span class="nb">${chunk.join("")}</span>` : chunk[0]);
    chunk = [];
  };

  const tokens = text.trim().match(/\*\*|\s+|[^\s*]+|\*/g) ?? [];
  for (const token of tokens) {
    if (token === "**") {
      bold = !bold;
      continue;
    }
    if (/^\s+$/.test(token)) {
      flush();
      continue;
    }
    const span = `<span class="w" style="--i:${index++}">${escapeHtml(token)}</span>`;
    chunk.push(bold ? `<strong>${span}</strong>` : span);
  }
  flush();

  return { html: chunks.join(" "), count: index };
}
