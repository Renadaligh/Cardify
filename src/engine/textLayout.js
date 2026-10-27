import { fontString } from "./fonts";

// Breaks text into lines that fit maxW. Respects line breaks the user typed,
// and splits a single word that is wider than the line.
export function wrapLines(ctx, text, maxW) {
  const lines = [];
  for (const paragraph of String(text).split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (let word of words) {
      while (ctx.measureText(word).width > maxW && word.length > 1) {
        let cut = word.length - 1;
        while (cut > 1 && ctx.measureText(word.slice(0, cut)).width > maxW) cut--;
        if (line) {
          lines.push(line);
          line = "";
        }
        lines.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/**
 * Finds a font size at which the text fits in `maxLines` lines of width maxW,
 * shrinking down to 60% of the requested size. Text that still doesn't fit is cut with "…".
 */
export function fitParagraph(ctx, text, { font, size, weight, maxW, maxLines }) {
  let s = size;
  let lines;
  for (;;) {
    ctx.font = fontString(font, s, weight);
    lines = wrapLines(ctx, text, maxW);
    if (lines.length <= maxLines || s <= size * 0.6) break;
    s *= 0.92;
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.trim()}…`;
  }
  return { lines, size: s };
}
