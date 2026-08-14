"use client";

import type { CvData } from "./types";

export type ExportLabels = {
  summary: string;
  experience: string;
  skills: string;
  contact: string;
  languages: string;
  education: string;
  certifications: string;
  location: string;
  phone: string;
  email: string;
  portfolio: string;
};

const safe = (value?: string) => value?.trim() ?? "";
const docxColor = (value: string, fallback: string) =>
  /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1).toUpperCase() : fallback;
const pdfColor = (
  value: string,
  fallback: [number, number, number],
  rgb: (red: number, green: number, blue: number) => unknown,
) => {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (!match) return rgb(...fallback);
  return rgb(
    Number.parseInt(match[1], 16) / 255,
    Number.parseInt(match[2], 16) / 255,
    Number.parseInt(match[3], 16) / 255,
  );
};

function download(bytes: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function slugName(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cv"
  );
}

async function dataUrlBytes(dataUrl: string) {
  return new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
}

async function cropPhoto(dataUrl: string) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 700;
  canvas.height = 800;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo procesar la foto");
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = canvas.width / canvas.height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;
  if (sourceRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas.toDataURL("image/jpeg", 0.9);
}

export async function exportDocx(data: CvData, labels: ExportLabels) {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    HeightRule,
    ImageRun,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import("docx");
  const primary = docxColor(data.primaryColor, "173B63");
  const accent = docxColor(data.accentColor, "3C6596");

  const heading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 220, after: 80 },
      border: { bottom: { color: primary, size: 8, style: BorderStyle.SINGLE } },
      children: [new TextRun({ text, bold: true, color: primary, size: 27 })],
    });

  const left: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: safe(data.name).toUpperCase() || "TU NOMBRE",
          bold: true,
          color: primary,
          size: 34,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: safe(data.headline), color: primary, size: 20 })],
    }),
  ];

  if (data.photo) {
    const image = await dataUrlBytes(await cropPhoto(data.photo));
    left.push(
      new Paragraph({
        spacing: { after: 220 },
        children: [
          new ImageRun({
            data: image,
            transformation: { width: 154, height: 176 },
            type: "jpg",
          }),
        ],
      }),
    );
  }

  const contacts = [
    [labels.location, data.location],
    [labels.phone, data.phone],
    [labels.email, data.email],
    [labels.portfolio, data.portfolio],
  ].filter(([, value]) => safe(value));

  if (contacts.length) {
    left.push(heading(labels.contact));
    contacts.forEach(([label, value]) => {
      const children = [
        new TextRun({ text: `${label}: `, bold: true, size: 18 }),
        new TextRun({
          text: safe(value),
          size: 18,
          color: label === labels.portfolio ? "0563C1" : undefined,
          underline: label === labels.portfolio ? {} : undefined,
        }),
      ];
      left.push(new Paragraph({ spacing: { after: 90 }, children }));
    });
  }

  if (data.languages.some((item) => safe(item.name))) {
    left.push(heading(labels.languages));
    data.languages
      .filter((item) => safe(item.name))
      .forEach((item) =>
        left.push(
          new Paragraph({
            spacing: { after: 55 },
            children: [
              new TextRun({ text: `${item.name}: `, bold: true, size: 18 }),
              new TextRun({ text: item.level, size: 18 }),
            ],
          }),
        ),
      );
  }

  const right: InstanceType<typeof Paragraph>[] = [];
  if (safe(data.summary)) {
    right.push(
      heading(labels.summary),
      new Paragraph({
        spacing: { after: 140, line: 280 },
        children: [new TextRun({ text: data.summary, size: 20 })],
      }),
    );
  }
  if (data.experiences.some((item) => safe(item.company) || safe(item.role))) {
    right.push(heading(labels.experience));
    data.experiences.forEach((experience) => {
      if (!safe(experience.company) && !safe(experience.role)) return;
      right.push(
        new Paragraph({
          spacing: { before: 80, after: 35 },
          children: [
            new TextRun({ text: safe(experience.company), bold: true, size: 20 }),
            new TextRun({ text: ` — ${safe(experience.role)}`, italics: true, size: 20 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 55 },
          children: [
            new TextRun({
              text: [safe(experience.location), [safe(experience.start), safe(experience.end)].filter(Boolean).join(" – ")]
                .filter(Boolean)
                .join(" · "),
              italics: true,
              size: 18,
            }),
          ],
        }),
      );
      experience.bullets
        .filter((bullet) => safe(bullet))
        .forEach((bullet) =>
          right.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 35, line: 245 },
              children: [new TextRun({ text: bullet, size: 18 })],
            }),
          ),
        );
    });
  }
  if (data.education.some((item) => safe(item.institution) || safe(item.degree))) {
    right.push(heading(labels.education));
    data.education.forEach((item) => {
      if (!safe(item.institution) && !safe(item.degree)) return;
      right.push(
        new Paragraph({
          spacing: { before: 55, after: 25 },
          children: [
            new TextRun({ text: safe(item.institution), bold: true, size: 20 }),
            new TextRun({ text: item.institution && item.degree ? ` — ${safe(item.degree)}` : safe(item.degree), italics: true, size: 20 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({
              text: [safe(item.location), [safe(item.start), safe(item.end)].filter(Boolean).join(" – ")]
                .filter(Boolean)
                .join(" · "),
              italics: true,
              size: 18,
            }),
          ],
        }),
      );
    });
  }
  if (data.certifications.some((item) => safe(item.name) || safe(item.issuer))) {
    right.push(heading(labels.certifications));
    data.certifications.forEach((item) => {
      if (!safe(item.name) && !safe(item.issuer)) return;
      right.push(
        new Paragraph({
          spacing: { before: 45, after: 45 },
          children: [
            new TextRun({ text: safe(item.name), bold: true, size: 19 }),
            new TextRun({
              text: [safe(item.issuer), safe(item.date)].filter(Boolean).length
                ? ` — ${[safe(item.issuer), safe(item.date)].filter(Boolean).join(" · ")}`
                : "",
              size: 18,
            }),
          ],
        }),
      );
    });
  }
  if (data.skills.some((skill) => safe(skill.name))) {
    right.push(heading(labels.skills));
    data.skills
      .map((skill) => skill.name.trim())
      .filter(Boolean)
      .forEach((skill) =>
        right.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 35, line: 245 },
            children: [new TextRun({ text: skill, size: 19 })],
          }),
        ),
      );
  }

  const cellMargins = { top: 180, bottom: 180, left: 180, right: 180 };
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3200, 6800],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        height: { value: 500, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            shading: { fill: accent, type: ShadingType.CLEAR },
            children: [new Paragraph("")],
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [new Paragraph("")],
          }),
        ],
      }),
      new TableRow({
        height: { value: 14500, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            margins: cellMargins,
            shading: { fill: "F1F3F5", type: ShadingType.CLEAR },
            children: left,
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            margins: { ...cellMargins, left: 260 },
            children: right.length ? right : [new Paragraph("")],
          }),
        ],
      }),
      new TableRow({
        height: { value: 300, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [new Paragraph("")],
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            shading: { fill: primary, type: ShadingType.CLEAR },
            children: [new Paragraph("")],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 18 } } },
      paragraphStyles: [
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Arial", bold: true, color: primary },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 420, right: 420, bottom: 420, left: 420 },
          },
        },
        children: [table],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  download(blob, `${slugName(data.name)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

export async function exportPdf(data: CvData, labels: ExportLabels) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const color = pdfColor(data.primaryColor, [23 / 255, 59 / 255, 99 / 255], rgb) as ReturnType<typeof rgb>;
  const accent = pdfColor(data.accentColor, [60 / 255, 101 / 255, 150 / 255], rgb) as ReturnType<typeof rgb>;
  const dark = rgb(24 / 255, 30 / 255, 38 / 255);
  const muted = rgb(0.94, 0.95, 0.96);

  page.drawRectangle({ x: 0, y: 0, width: 202, height: 841.89, color: muted });
  page.drawRectangle({ x: 0, y: 812, width: 202, height: 30, color: accent });
  page.drawRectangle({ x: 202, y: 0, width: 393, height: 18, color });

  const wrap = (text: string, font: typeof regular, size: number, width: number) => {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  };
  const textBlock = (
    text: string,
    x: number,
    y: number,
    width: number,
    size = 9,
    lineHeight = 12,
    font = regular,
    maxLines = 20,
  ) => {
    const lines = wrap(text, font, size, width).slice(0, maxLines);
    lines.forEach((line, index) =>
      page.drawText(line, { x, y: y - index * lineHeight, size, font, color: dark }),
    );
    return y - lines.length * lineHeight;
  };
  const heading = (text: string, x: number, y: number, width: number) => {
    page.drawText(text, { x, y, size: 16, font: bold, color });
    page.drawLine({ start: { x, y: y - 5 }, end: { x: x + width, y: y - 5 }, thickness: 0.7, color });
    return y - 22;
  };

  let leftY = 775;
  wrap(safe(data.name).toUpperCase() || "TU NOMBRE", bold, 20, 164)
    .slice(0, 2)
    .forEach((line, index) => page.drawText(line, { x: 20, y: leftY - index * 24, size: 20, font: bold, color }));
  leftY -= safe(data.name).length > 16 ? 58 : 34;
  if (safe(data.headline)) {
    leftY = textBlock(data.headline, 20, leftY, 164, 9, 11, bold, 2) - 7;
  }
  if (data.photo) {
    try {
      const bytes = await dataUrlBytes(await cropPhoto(data.photo));
      const image = await pdf.embedJpg(bytes);
      const targetW = 147;
      const targetH = 168;
      page.drawImage(image, { x: 20, y: leftY - targetH, width: targetW, height: targetH });
      leftY -= targetH + 22;
    } catch {
      // The CV still exports if an unsupported image slips through.
    }
  }

  const contacts = [
    [labels.location, data.location],
    [labels.phone, data.phone],
    [labels.email, data.email],
    [labels.portfolio, data.portfolio],
  ].filter(([, value]) => safe(value));
  if (contacts.length) {
    leftY = heading(labels.contact, 20, leftY, 162);
    contacts.forEach(([label, value]) => {
      page.drawText(`${label}:`, { x: 20, y: leftY, size: 8.5, font: bold, color: dark });
      leftY = textBlock(value, 20, leftY - 12, 162, 8.2, 10, regular, 2) - 7;
    });
  }
  const languages = data.languages.filter((item) => safe(item.name));
  if (languages.length) {
    leftY = heading(labels.languages, 20, leftY - 3, 162);
    languages.forEach((item) => {
      page.drawText(`${item.name}:`, { x: 20, y: leftY, size: 8.5, font: bold, color: dark });
      leftY = textBlock(item.level, 20, leftY - 11, 162, 8.2, 10, regular, 2) - 5;
    });
  }

  let rightY = 775;
  if (safe(data.summary)) {
    rightY = heading(labels.summary, 226, rightY, 345);
    rightY = textBlock(data.summary, 226, rightY, 345, 9.5, 13, regular, 7) - 6;
  }
  const experiences = data.experiences.filter((item) => safe(item.company) || safe(item.role));
  if (experiences.length) {
    rightY = heading(labels.experience, 226, rightY, 345);
    experiences.forEach((item) => {
      rightY = textBlock(
        [safe(item.company), safe(item.role)].filter(Boolean).join(" — "),
        226,
        rightY,
        345,
        9.5,
        12,
        bold,
        2,
      );
      rightY = textBlock(
        [safe(item.location), [safe(item.start), safe(item.end)].filter(Boolean).join(" – ")]
          .filter(Boolean)
          .join(" · "),
        226,
        rightY - 2,
        345,
        8.5,
        11,
        italic,
        2,
      );
      item.bullets
        .filter((bullet) => safe(bullet))
        .forEach((bullet) => {
          page.drawCircle({ x: 231, y: rightY + 3, size: 1.5, color: dark });
          rightY = textBlock(bullet, 241, rightY, 330, 8.6, 11, regular, 3);
        });
      rightY -= 8;
    });
  }
  const education = data.education.filter((item) => safe(item.institution) || safe(item.degree));
  if (education.length && rightY > 80) {
    rightY = heading(labels.education, 226, rightY, 345);
    education.forEach((item) => {
      rightY = textBlock(
        [safe(item.institution), safe(item.degree)].filter(Boolean).join(" — "),
        226,
        rightY,
        345,
        9.2,
        11,
        bold,
        2,
      );
      rightY = textBlock(
        [safe(item.location), [safe(item.start), safe(item.end)].filter(Boolean).join(" – ")]
          .filter(Boolean)
          .join(" · "),
        226,
        rightY - 2,
        345,
        8.3,
        10,
        italic,
        2,
      ) - 6;
    });
  }
  const certifications = data.certifications.filter((item) => safe(item.name) || safe(item.issuer));
  if (certifications.length && rightY > 80) {
    rightY = heading(labels.certifications, 226, rightY, 345);
    certifications.forEach((item) => {
      rightY = textBlock(safe(item.name), 226, rightY, 345, 9, 11, bold, 2);
      rightY = textBlock(
        [safe(item.issuer), safe(item.date)].filter(Boolean).join(" · "),
        226,
        rightY - 1,
        345,
        8.3,
        10,
        italic,
        2,
      ) - 5;
    });
  }
  if (data.skills.some((skill) => safe(skill.name)) && rightY > 55) {
    rightY = heading(labels.skills, 226, rightY, 345);
    data.skills
      .map((skill) => skill.name.trim())
      .filter(Boolean)
      .slice(0, 12)
      .forEach((skill) => {
        page.drawCircle({ x: 231, y: rightY + 3, size: 1.5, color: dark });
        rightY = textBlock(skill, 241, rightY, 330, 9, 12, regular, 2);
      });
  }

  const bytes = await pdf.save();
  const pdfBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  download(pdfBuffer, `${slugName(data.name)}.pdf`, "application/pdf");
}
