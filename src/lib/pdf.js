// Minimal PDF writer: one full-page JPEG image per page.
// Used for certificates (A4 landscape) so teachers get a print-ready file.

const A4_LANDSCAPE = { width: 841.89, height: 595.28 };

/**
 * @param {{jpeg: Uint8Array, width: number, height: number}[]} pages
 * @returns {Blob}
 */
export function createImagePdf(pages, pageSize = A4_LANDSCAPE) {
  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [];
  let length = 0;

  const push = (data) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    parts.push(bytes);
    length += bytes.length;
  };

  // Object numbers: 1 catalog, 2 pages, then 3 per page (page, content, image)
  const pageObj = (i) => 3 + i * 3;
  const startObj = (num) => {
    offsets[num] = length;
    push(`${num} 0 obj\n`);
  };

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  startObj(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObj(2);
  const kids = pages.map((_, i) => `${pageObj(i)} 0 R`).join(" ");
  push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);

  const { width: pw, height: ph } = pageSize;

  pages.forEach((page, i) => {
    const p = pageObj(i);
    const c = p + 1;
    const img = p + 2;

    startObj(p);
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] ` +
        `/Resources << /XObject << /Im${i} ${img} 0 R >> >> /Contents ${c} 0 R >>\nendobj\n`
    );

    const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im${i} Do Q`;
    startObj(c);
    push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

    startObj(img);
    push(
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`
    );
    push(page.jpeg);
    push("\nendstream\nendobj\n");
  });

  const xrefStart = length;
  const count = offsets.length;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let n = 1; n < count; n++) {
    xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  }
  push(xref);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob(parts, { type: "application/pdf" });
}
