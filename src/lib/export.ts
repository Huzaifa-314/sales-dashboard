// Dependency-free CSV, Excel (.xlsx) and PDF writers for table exports.
// Data is a plain table; each format renders it its own way.

export type ExportColumn = {
  label: string;
  kind: "text" | "money" | "int";
  width: number; // relative width, used by the PDF layout
};

export type ExportTable = {
  title: string;
  subtitle: string;
  footer: string; // e.g. "Generated with InvoisPro"
  columns: ExportColumn[];
  rows: (string | number)[][];
  totals?: (string | number | null)[]; // same length as columns
};

const fmtMoney = (n: number) =>
  n.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- CSV -------------------------------------------------------------------
// BOM so Excel reads UTF-8; numbers stay plain so they sum.
export function toCsv(t: ExportTable) {
  const cell = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "number" ? String(v) : v;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    t.columns.map((c) => cell(c.label)).join(","),
    ...t.rows.map((r) => r.map(cell).join(",")),
  ];
  if (t.totals) lines.push(t.totals.map(cell).join(","));
  return new Blob(["﻿" + lines.join("\r\n") + "\r\n"], {
    type: "text/csv;charset=utf-8",
  });
}

// ---- XLSX ------------------------------------------------------------------
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Minimal ZIP writer (stored, no compression), enough for an .xlsx package.
function zip(files: { name: string; data: string }[]) {
  const enc = new TextEncoder();
  const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const name = enc.encode(f.name);
    const data = enc.encode(f.data);
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(10, 0, true);
    local.setUint16(12, DOS_DATE, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(new Uint8Array(local.buffer), name, data);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(14, DOS_DATE, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);

    offset += 30 + name.length + data.length;
  }

  const cdSize = central.reduce((s, p) => s + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);

  return new Blob(
    [...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[],
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  );
}

const xml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function colLetter(i: number) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  }
  return s;
}

// Styles: 0 plain, 1 bold header, 2 money (#,##0.00), 3 integer, 4 bold money, 5 bold text
export function toXlsx(t: ExportTable) {
  const text = (ref: string, v: string, style = 0) =>
    `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ""}><is><t>${xml(v)}</t></is></c>`;
  const num = (ref: string, v: number, style: number) =>
    `<c r="${ref}" s="${style}"><v>${v}</v></c>`;

  const rowXml = (
    values: (string | number | null)[],
    r: number,
    bold: boolean,
  ) =>
    `<row r="${r}">${values
      .map((v, i) => {
        const ref = `${colLetter(i)}${r}`;
        if (v === null || v === "") return "";
        const kind = t.columns[i].kind;
        if (typeof v === "number") {
          return num(ref, v, kind === "int" ? 3 : bold ? 4 : 2);
        }
        return text(ref, v, bold ? 5 : 0);
      })
      .join("")}</row>`;

  const header = `<row r="1">${t.columns
    .map((c, i) => text(`${colLetter(i)}1`, c.label, 1))
    .join("")}</row>`;
  const body = t.rows.map((r, i) => rowXml(r, i + 2, false)).join("");
  const totals = t.totals ? rowXml(t.totals, t.rows.length + 2, true) : "";
  const cols = t.columns
    .map(
      (c, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${Math.max(12, Math.round(c.width * 1.6))}" customWidth="1"/>`,
    )
    .join("");

  const ns =
    'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

  return zip([
    {
      name: "[Content_Types].xml",
      data: `${head}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      data: `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      data: `${head}<workbook ${ns} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(t.title.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      name: "xl/styles.xml",
      data: `${head}<styleSheet ${ns}><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      data: `${head}<worksheet ${ns}><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${header}${body}${totals}</sheetData></worksheet>`,
    },
  ]);
}

// ---- PDF -------------------------------------------------------------------
// A4 landscape, Helvetica, ASCII only (other characters print as "?").
const PAGE_W = 842;
const PAGE_H = 595;
const MARGIN = 36;
const ROW_H = 21;
const HEAD_H = 26;

function textWidth(s: string, size: number, bold = false) {
  let w = 0;
  for (const ch of s) {
    if (/[0-9]/.test(ch)) w += 0.556;
    else if (" .,:;|!'".includes(ch)) w += 0.278;
    else if ("ijlIft()".includes(ch)) w += 0.28;
    else if ("mwMW".includes(ch)) w += 0.85;
    else if (/[A-Z]/.test(ch)) w += 0.68;
    else w += 0.52;
  }
  return w * size * (bold ? 1.06 : 1);
}

const pdfText = (s: string) =>
  s
    .replace(/[·–—]/g, "-")
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/[\\()]/g, "\\$&");

function fit(s: string, max: number, size: number, bold = false) {
  if (textWidth(s, size, bold) <= max) return s;
  let out = s;
  while (out.length > 1 && textWidth(out + "..", size, bold) > max)
    out = out.slice(0, -1);
  return out + "..";
}

export function toPdf(t: ExportTable) {
  const inner = PAGE_W - MARGIN * 2;
  const totalW = t.columns.reduce((s, c) => s + c.width, 0);
  const widths = t.columns.map((c) => (c.width / totalW) * inner);
  const xs = widths.map(
    (_, i) => MARGIN + widths.slice(0, i).reduce((s, w) => s + w, 0),
  );

  const fmt = (v: string | number | null, c: ExportColumn) =>
    v === null
      ? ""
      : typeof v === "number"
        ? c.kind === "money"
          ? fmtMoney(v)
          : String(v)
        : v;

  // Paginate: first page has a title block, so fewer rows fit.
  const bottom = MARGIN + 22;
  const firstTop = PAGE_H - MARGIN - 62;
  const nextTop = PAGE_H - MARGIN - 8;
  const allRows = [...t.rows.map((r) => ({ r, bold: false }))];
  if (t.totals)
    allRows.push({ r: t.totals as (string | number)[], bold: true });
  const pages: (typeof allRows)[] = [];
  let cur: typeof allRows = [];
  let top = firstTop;
  let y = top - HEAD_H;
  for (const row of allRows) {
    if (y - ROW_H < bottom) {
      pages.push(cur);
      cur = [];
      top = nextTop;
      y = top - HEAD_H;
    }
    cur.push(row);
    y -= ROW_H;
  }
  pages.push(cur);

  const streams = pages.map((rows, p) => {
    const ops: string[] = [];
    const put = (
      x: number,
      yy: number,
      s: string,
      size: number,
      opts: { bold?: boolean; gray?: number; right?: boolean } = {},
    ) => {
      const shown = pdfText(s);
      const w = textWidth(shown, size, opts.bold);
      const px = opts.right ? x - w : x;
      ops.push(
        `BT /${opts.bold ? "F2" : "F1"} ${size} Tf ${opts.gray ?? 0.1} g ${px.toFixed(2)} ${yy.toFixed(2)} Td (${shown}) Tj ET`,
      );
    };
    const line = (yy: number, gray: number, width = 0.5) =>
      ops.push(
        `${gray} G ${width} w ${MARGIN} ${yy.toFixed(2)} m ${PAGE_W - MARGIN} ${yy.toFixed(2)} l S`,
      );

    let tableTop = nextTop;
    if (p === 0) {
      put(MARGIN, PAGE_H - MARGIN - 14, t.title, 18, { bold: true });
      put(MARGIN, PAGE_H - MARGIN - 32, t.subtitle, 9, { gray: 0.4 });
      tableTop = firstTop;
    }

    ops.push(`0.95 g ${MARGIN} ${tableTop - HEAD_H} ${inner} ${HEAD_H} re f`);
    t.columns.forEach((c, i) => {
      const label = fit(c.label.toUpperCase(), widths[i] - 12, 7, true);
      const right = c.kind !== "text";
      put(right ? xs[i] + widths[i] - 6 : xs[i] + 6, tableTop - 16, label, 7, {
        bold: true,
        gray: 0.35,
        right,
      });
    });
    line(tableTop - HEAD_H, 0.7);

    rows.forEach(({ r, bold }, ri) => {
      const rowTop = tableTop - HEAD_H - ri * ROW_H;
      if (bold) line(rowTop, 0.3, 0.8);
      r.forEach((v, i) => {
        const c = t.columns[i];
        const s = fit(fmt(v, c), widths[i] - 12, 8, bold);
        const right = c.kind !== "text";
        put(right ? xs[i] + widths[i] - 6 : xs[i] + 6, rowTop - 14, s, 8, {
          bold,
          right,
        });
      });
      line(rowTop - ROW_H, 0.9);
    });

    put(MARGIN, 22, t.footer, 8, { gray: 0.5 });
    put(PAGE_W - MARGIN, 22, `${p + 1} / ${pages.length}`, 8, {
      gray: 0.5,
      right: true,
    });
    return ops.join("\n");
  });

  const offsets: number[] = [];
  let out = "%PDF-1.4\n";
  const add = (body: string) => {
    offsets.push(out.length);
    out += `${offsets.length} 0 obj\n${body}\nendobj\n`;
  };
  const kids = pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ");
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  add(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  );
  add(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  );
  streams.forEach((s, i) => {
    add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`,
    );
    add(`<< /Length ${s.length} >>\nstream\n${s}\nendstream`);
  });
  const xref = out.length;
  out += `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (out += `${String(o).padStart(10, "0")} 00000 n \n`));
  out += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new Blob([out], { type: "application/pdf" });
}
