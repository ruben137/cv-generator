"use client";

import type { CoverLetterDraft } from "./cover-letter";

const cleanFilename = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "") || "carta-presentacion";

const triggerDownload = (bytes: BlobPart, filename: string, type: string) => {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const letterParagraphs = (draft: CoverLetterDraft) => [
  draft.content.greeting,
  draft.content.opening,
  draft.content.evidence,
  draft.content.motivation,
  draft.content.closing,
].map((value) => value.trim()).filter(Boolean);

export async function downloadCoverLetterDocx(draft: CoverLetterDraft) {
  const { AlignmentType, Document, Packer, Paragraph, TextRun } = await import("docx");
  const date = new Intl.DateTimeFormat(draft.locale, { dateStyle: "long" }).format(new Date(draft.updatedAt));
  const body = letterParagraphs(draft).flatMap((paragraph) => paragraph.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean));
  const document = new Document({
    creator: "CV Simple",
    title: draft.title,
    description: draft.locale === "en" ? "Cover letter" : "Carta de presentación",
    styles: {
      default: { document: { run: { font: "Arial", size: 22, color: "263746" }, paragraph: { spacing: { after: 180, line: 300 } } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1134, right: 1276, bottom: 1134, left: 1276 },
        },
      },
      children: [
        new Paragraph({ children: [new TextRun({ text: draft.content.signature || draft.title, bold: true, size: 30, color: "173B63" })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: date, color: "607283", size: 20 })], alignment: AlignmentType.RIGHT, spacing: { after: 360 } }),
        ...(draft.content.recipient ? [new Paragraph({ children: [new TextRun({ text: draft.content.recipient, bold: true })], spacing: { after: 100 } })] : []),
        ...(draft.content.subject ? [new Paragraph({ children: [new TextRun({ text: `${draft.locale === "en" ? "Subject" : "Asunto"}: ${draft.content.subject}`, bold: true, color: "173B63" })], spacing: { before: 120, after: 260 } })] : []),
        ...body.map((text) => new Paragraph({ children: [new TextRun(text)], alignment: AlignmentType.JUSTIFIED, spacing: { after: 220, line: 320 } })),
        ...(draft.content.signature ? [new Paragraph({ children: [new TextRun({ text: draft.content.signature, bold: true, color: "173B63" })], spacing: { before: 220 } })] : []),
      ],
    }],
  });
  triggerDownload(await Packer.toBlob(document), `${cleanFilename(draft.title)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

export async function downloadCoverLetterPdf(draft: CoverLetterDraft) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setTitle(draft.title);
  pdf.setAuthor("CV Simple");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 62;
  const contentWidth = pageSize[0] - margin * 2;
  const bodySize = 10.8;
  const lineHeight = 16.3;
  const color = rgb(0.15, 0.22, 0.28);
  const accent = rgb(0.09, 0.23, 0.39);
  let page = pdf.addPage(pageSize);
  let y = pageSize[1] - margin;

  const newPage = () => {
    page = pdf.addPage(pageSize);
    y = pageSize[1] - margin;
    page.drawRectangle({ x: 0, y: pageSize[1] - 10, width: pageSize[0], height: 10, color: accent });
  };
  page.drawRectangle({ x: 0, y: pageSize[1] - 10, width: pageSize[0], height: 10, color: accent });

  const ensureSpace = (height: number) => { if (y - height < margin) newPage(); };
  const wrap = (text: string, maxWidth: number, font = regular, size = bodySize) => {
    const lines: string[] = [];
    for (const sourceLine of text.split("\n")) {
      const words = sourceLine.trim().split(/\s+/).filter(Boolean);
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) line = candidate;
        else { lines.push(line); line = word; }
      }
      if (line) lines.push(line);
      else if (!sourceLine.trim()) lines.push("");
    }
    return lines;
  };
  const drawBlock = (text: string, options: { font?: typeof regular; size?: number; tint?: typeof color; gap?: number } = {}) => {
    const font = options.font ?? regular;
    const size = options.size ?? bodySize;
    const lines = wrap(text, contentWidth, font, size);
    ensureSpace(lines.length * lineHeight + (options.gap ?? 10));
    for (const line of lines) { page.drawText(line, { x: margin, y, size, font, color: options.tint ?? color }); y -= lineHeight; }
    y -= options.gap ?? 10;
  };

  drawBlock(draft.content.signature || draft.title, { font: bold, size: 17, tint: accent, gap: 5 });
  const date = new Intl.DateTimeFormat(draft.locale, { dateStyle: "long" }).format(new Date(draft.updatedAt));
  page.drawText(date, { x: pageSize[0] - margin - regular.widthOfTextAtSize(date, 9.5), y: y + lineHeight, size: 9.5, font: regular, color: rgb(0.37, 0.45, 0.52) });
  y -= 20;
  if (draft.content.recipient) drawBlock(draft.content.recipient, { font: bold, gap: 8 });
  if (draft.content.subject) drawBlock(`${draft.locale === "en" ? "Subject" : "Asunto"}: ${draft.content.subject}`, { font: bold, tint: accent, gap: 18 });
  for (const paragraph of letterParagraphs(draft).flatMap((text) => text.split(/\n{2,}/)).filter(Boolean)) drawBlock(paragraph, { gap: 11 });
  if (draft.content.signature) drawBlock(draft.content.signature, { font: bold, tint: accent, gap: 0 });

  const bytes = await pdf.save();
  const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  triggerDownload(data, `${cleanFilename(draft.title)}.pdf`, "application/pdf");
}
