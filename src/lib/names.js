// Read a list of names from pasted text, CSV or an Excel (.xlsx) file.
// No libraries: .xlsx is a zip of XML files, unpacked with the browser's
// built-in DecompressionStream.

const HEADER_WORDS = ["الاسم", "اسم", "الأسماء", "name", "names", "full name", "student"];

export function cleanNames(list) {
  const names = list
    .map((n) => String(n ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (names.length && HEADER_WORDS.includes(names[0].toLowerCase())) names.shift();
  return names;
}

export function namesFromText(text) {
  return cleanNames(text.split(/\r?\n/));
}

function firstCsvField(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('"')) {
    const end = trimmed.indexOf('"', 1);
    return end > 0 ? trimmed.slice(1, end) : trimmed.slice(1);
  }
  return trimmed.split(/[,;\t]/)[0];
}

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzipEntries(buffer, wanted) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();

  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip");

  const total = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  const out = {};

  for (let i = 0; i < total; i++) {
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);
    const name = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));

    if (wanted(name)) {
      const lNameLen = view.getUint16(localOffset + 26, true);
      const lExtraLen = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + lNameLen + lExtraLen;
      const data = bytes.subarray(start, start + compSize);
      out[name] = decoder.decode(method === 8 ? await inflateRaw(data) : data);
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function namesFromXlsx(buffer) {
  const files = await unzipEntries(
    buffer,
    (n) => n === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n)
  );
  const sheetName = Object.keys(files)
    .filter((n) => n.startsWith("xl/worksheets/"))
    .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]))[0];
  if (!sheetName) return [];

  const parser = new DOMParser();
  const shared = [];
  if (files["xl/sharedStrings.xml"]) {
    const doc = parser.parseFromString(files["xl/sharedStrings.xml"], "application/xml");
    for (const si of doc.getElementsByTagName("si")) {
      shared.push([...si.getElementsByTagName("t")].map((t) => t.textContent).join(""));
    }
  }

  const sheet = parser.parseFromString(files[sheetName], "application/xml");
  const names = [];
  for (const cell of sheet.getElementsByTagName("c")) {
    const ref = cell.getAttribute("r") || "";
    if (!/^A\d+$/.test(ref)) continue;
    const type = cell.getAttribute("t");
    if (type === "s") {
      const v = cell.getElementsByTagName("v")[0];
      names.push(shared[Number(v?.textContent)] ?? "");
    } else if (type === "inlineStr") {
      names.push([...cell.getElementsByTagName("t")].map((t) => t.textContent).join(""));
    } else {
      names.push(cell.getElementsByTagName("v")[0]?.textContent ?? "");
    }
  }
  return cleanNames(names);
}

/** Reads the first column of a .xlsx / .csv / .txt file. */
export async function namesFromFile(file) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xlsx")) return namesFromXlsx(await file.arrayBuffer());
  if (lower.endsWith(".xls")) throw new Error("xls");
  const text = await file.text();
  return cleanNames(text.split(/\r?\n/).map(firstCsvField));
}
