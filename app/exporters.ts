"use client";

import { mainSectionIds, normalizeContentOrder, normalizeSectionOrder, type CvData, type MainSectionId } from "./types";

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

async function cropPhoto(dataUrl: string, shape: CvData["photoShape"]) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 700;
  canvas.height = shape === "round" ? 700 : 800;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo procesar la foto");
  if (shape !== "round") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (shape === "round") {
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    context.clip();
  }
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
  return canvas.toDataURL(shape === "round" ? "image/png" : "image/jpeg", 0.9);
}

export async function exportDocx(data: CvData, labels: ExportLabels, filename?: string) {
  const {
    BorderStyle,
    AlignmentType,
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
  const isHarvard = data.template === "harvard";
  const docxFont = isHarvard || data.fontFamily === "times" ? "Times New Roman" : data.fontFamily === "serif" ? "Georgia" : data.fontFamily === "humanist" ? "Calibri" : "Arial";
  const isModern = data.template === "modern";
  const isMinimal = data.template === "minimal";
  const isRight = data.template === "right";
  const isCompact = data.template === "compact";
  const isContrast = data.template === "contrast";
  const isEditorial = data.template === "editorial";
  const hasDarkSidebar = isRight || isContrast || isEditorial;
  const sidebarTextColor = hasDarkSidebar ? "FFFFFF" : undefined;
  const sidebarPercent = data.template === "compact" ? 28 : isEditorial ? 38 : 32;

  const heading = (text: string, textColor = primary, borderColor = primary, main = false) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: isHarvard ? 170 : 220, after: isHarvard ? 55 : 80 },
      border: isHarvard
        ? { bottom: { color: "222222", size: 8, style: BorderStyle.SINGLE } }
        : (isCompact || isContrast) && main
        ? { left: { color: accent, size: 22, space: 8, style: BorderStyle.SINGLE } }
        : isEditorial && main
        ? { left: { color: accent, size: 22, space: 8, style: BorderStyle.SINGLE } }
        : { bottom: { color: borderColor, size: 8, style: BorderStyle.SINGLE } },
      shading: ((isCompact || isContrast) && main) || (isEditorial && main) ? { fill: "E8EDF2", type: ShadingType.CLEAR } : undefined,
      children: [new TextRun({
        text: isHarvard || ((isCompact || isContrast) && main) ? text.toUpperCase() : text,
        bold: !((isCompact || isContrast) && main),
        color: isHarvard ? "171717" : textColor,
        size: isHarvard ? 22 : (isCompact || isContrast) && main ? 23 : 27,
      })],
    });

  const left: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: safe(data.name).toUpperCase() || "TU NOMBRE",
          bold: true,
          color: hasDarkSidebar ? "FFFFFF" : primary,
          size: 34,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: safe(data.headline), color: hasDarkSidebar ? "FFFFFF" : primary, size: 20 })],
    }),
  ];

  if (data.photo && !isHarvard) {
    const image = await dataUrlBytes(await cropPhoto(data.photo, data.photoShape));
    left.push(
      new Paragraph({
        spacing: { after: 220 },
        children: [
          new ImageRun({
            data: image,
            transformation: { width: 154, height: data.photoShape === "round" ? 154 : 176 },
            type: data.photoShape === "round" ? "png" : "jpg",
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
    left.push(heading(labels.contact, hasDarkSidebar ? "FFFFFF" : primary, hasDarkSidebar ? accent : primary));
    contacts.forEach(([label, value]) => {
      const children = [
        new TextRun({ text: `${label}: `, bold: true, size: 18, color: sidebarTextColor }),
        new TextRun({
          text: safe(value),
          size: 18,
          color: hasDarkSidebar ? "FFFFFF" : label === labels.portfolio ? "0563C1" : undefined,
          underline: label === labels.portfolio ? {} : undefined,
        }),
      ];
      left.push(new Paragraph({ spacing: { after: 90 }, children }));
    });
  }

  if (data.languages.some((item) => safe(item.name))) {
    left.push(heading(labels.languages, hasDarkSidebar ? "FFFFFF" : primary, hasDarkSidebar ? accent : primary));
    data.languages
      .filter((item) => safe(item.name))
      .forEach((item) =>
        left.push(
          new Paragraph({
            spacing: { after: 55 },
            children: [
              new TextRun({ text: `${item.name}: `, bold: true, size: 18, color: sidebarTextColor }),
              new TextRun({ text: item.level, size: 18, color: sidebarTextColor }),
            ],
          }),
        ),
      );
  }

  const sectionParagraphs: Record<string, InstanceType<typeof Paragraph>[]> = Object.fromEntries(
    normalizeSectionOrder(data.sectionOrder).map((section) => [section, [] as InstanceType<typeof Paragraph>[]]),
  );
  let right = sectionParagraphs.summary;
  if (safe(data.summary)) {
    right.push(
      heading(labels.summary, primary, primary, true),
      new Paragraph({
        spacing: { after: 140, line: 280 },
        children: [new TextRun({ text: data.summary, size: 20 })],
      }),
    );
  }
  right = sectionParagraphs.experience;
  if (data.experiences.some((item) => safe(item.company) || safe(item.role))) {
    right.push(heading(labels.experience, primary, primary, true));
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
  right = sectionParagraphs.education;
  if (data.education.some((item) => safe(item.institution) || safe(item.degree))) {
    right.push(heading(labels.education, primary, primary, true));
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
  right = sectionParagraphs.certifications;
  if (data.certifications.some((item) => safe(item.name) || safe(item.issuer))) {
    right.push(heading(labels.certifications, primary, primary, true));
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
  right = sectionParagraphs.skills;
  if (data.skills.some((skill) => safe(skill.name))) {
    right.push(heading(labels.skills, primary, primary, true));
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
  data.customSections.forEach((section) => {
    const paragraphs: InstanceType<typeof Paragraph>[] = [];
    if (section.type === "text" && safe(section.text)) {
      paragraphs.push(
        heading(safe(section.title) || "Section", primary, primary, true),
        new Paragraph({ spacing: { after: 140, line: 280 }, children: [new TextRun({ text: section.text, size: 20 })] }),
      );
    }
    if (section.type === "list" && section.items.some((item) => safe(item.text))) {
      paragraphs.push(heading(safe(section.title) || "Section", primary, primary, true));
      section.items.filter((item) => safe(item.text)).forEach((item) => paragraphs.push(
        new Paragraph({ bullet: { level: 0 }, spacing: { after: 35, line: 245 }, children: [new TextRun({ text: item.text, size: 19 })] }),
      ));
    }
    sectionParagraphs[section.id] = paragraphs;
  });
  const orderedRight = normalizeContentOrder(data.contentOrder, data.sectionOrder, data.customSections)
    .flatMap((section) => sectionParagraphs[section] ?? []);

  if (isCompact || isContrast) {
    const headerInk = isContrast ? "FFFFFF" : primary;
    const identityHeader: InstanceType<typeof Paragraph>[] = [
      new Paragraph({
        spacing: { after: 45 },
        children: [new TextRun({ text: safe(data.name).toUpperCase() || "TU NOMBRE", bold: true, color: headerInk, size: 36 })],
      }),
      ...(safe(data.headline) ? [new Paragraph({
        spacing: { after: 65 },
        children: [new TextRun({ text: safe(data.headline), bold: true, color: headerInk, size: 20 })],
      })] : []),
    ];
    const photoHeader: InstanceType<typeof Paragraph>[] = [];
    if (data.photo) {
      const image = await dataUrlBytes(await cropPhoto(data.photo, data.photoShape));
      photoHeader.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({
          data: image,
          transformation: { width: 96, height: data.photoShape === "round" ? 96 : 110 },
          type: data.photoShape === "round" ? "png" : "jpg",
        })],
      }));
    }
    const detailsHeader: InstanceType<typeof Paragraph>[] = [];
    if (contacts.length) {
      detailsHeader.push(new Paragraph({
        spacing: { after: 65 },
        border: { bottom: { color: isContrast ? accent : primary, size: 7, style: BorderStyle.SINGLE } },
        children: [new TextRun({ text: labels.contact.toUpperCase(), bold: true, color: headerInk, size: 19 })],
      }));
    }
    contacts.forEach(([label, value]) => detailsHeader.push(new Paragraph({
      spacing: { after: 45 },
      children: [
        new TextRun({ text: `${label.toUpperCase()}: `, bold: true, color: isContrast ? accent : primary, size: 15 }),
        new TextRun({ text: safe(value), color: headerInk, size: 17 }),
      ],
    })));
    if (!isContrast && data.languages.some((item) => safe(item.name))) {
      detailsHeader.push(new Paragraph({
        spacing: { before: 45, after: 55 },
        border: { bottom: { color: primary, size: 7, style: BorderStyle.SINGLE } },
        children: [new TextRun({ text: labels.languages.toUpperCase(), bold: true, color: headerInk, size: 19 })],
      }));
    }
    data.languages.filter((item) => safe(item.name)).forEach((item) => {
      const target = isContrast ? identityHeader : detailsHeader;
      target.push(new Paragraph({
        spacing: { after: 25 },
        children: [
          new TextRun({ text: `${item.name}: `, bold: true, color: headerInk, size: 17 }),
          new TextRun({ text: item.level, color: headerInk, size: 17 }),
        ],
      }));
    });

    const fullWidth = 11906;
    const headerWidths = [4450, 2250, 5206];
    const headerFill = isContrast ? primary : "F2F5F7";
    const borderlessCell = (width: number, children: InstanceType<typeof Paragraph>[], alignment?: typeof AlignmentType.CENTER) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      verticalAlign: "center",
      margins: { top: 220, bottom: 180, left: 320, right: 320 },
      shading: { fill: headerFill, type: ShadingType.CLEAR },
      children: children.length ? children : [new Paragraph({ alignment, children: [new TextRun("")] })],
    });
    const horizontalTable = new Table({
      width: { size: fullWidth, type: WidthType.DXA },
      columnWidths: headerWidths,
      borders: {
        top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          height: { value: 180, rule: HeightRule.EXACT },
          children: headerWidths.map((width) => new TableCell({ width: { size: width, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 0, right: 0 }, shading: { fill: accent, type: ShadingType.CLEAR }, children: [new Paragraph("")] })),
        }),
        new TableRow({
          cantSplit: true,
          children: [
            borderlessCell(headerWidths[0], identityHeader),
            borderlessCell(headerWidths[1], photoHeader, AlignmentType.CENTER),
            borderlessCell(headerWidths[2], detailsHeader),
          ],
        }),
        new TableRow({ children: [new TableCell({ columnSpan: 3, width: { size: fullWidth, type: WidthType.DXA }, margins: { top: 220, bottom: 220, left: 520, right: 520 }, children: orderedRight.length ? orderedRight : [new Paragraph("")] })] }),
        new TableRow({
          height: { value: 140, rule: HeightRule.EXACT },
          children: headerWidths.map((width) => new TableCell({ width: { size: width, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 0, right: 0 }, shading: { fill: isContrast ? accent : primary, type: ShadingType.CLEAR }, children: [new Paragraph("")] })),
        }),
      ],
    });
    const horizontalDoc = new Document({
      styles: {
        default: { document: { run: { font: docxFont, size: 18 } } },
        paragraphStyles: [{ id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: docxFont, bold: true, color: primary } }],
      },
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
        children: [horizontalTable, new Paragraph({ spacing: { before: 0, after: 0, line: 1 }, children: [new TextRun({ text: "\u200B", size: 2 })] })],
      }],
    });
    const horizontalBlob = await Packer.toBlob(horizontalDoc);
    download(horizontalBlob, `${slugName(filename || data.name)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    return;
  }

  if (isHarvard) {
    const contactLine = contacts.map(([, value]) => safe(value)).join("  |  ");
    const languageLine = data.languages
      .filter((item) => safe(item.name))
      .map((item) => `${item.name}: ${item.level}`)
      .join("  |  ");
    const harvardHeader = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 70 },
        children: [new TextRun({ text: safe(data.name).toUpperCase() || "TU NOMBRE", bold: true, size: 38, font: "Times New Roman" })],
      }),
      ...(safe(data.headline) ? [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 55 },
        children: [new TextRun({ text: safe(data.headline), size: 20, font: "Times New Roman" })],
      })] : []),
      ...(contactLine ? [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 45 },
        children: [new TextRun({ text: contactLine, size: 17, font: "Arial" })],
      })] : []),
      ...(languageLine ? [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        border: { bottom: { color: "222222", size: 12, style: BorderStyle.SINGLE } },
        children: [new TextRun({ text: languageLine, size: 17, font: "Arial" })],
      })] : [new Paragraph({ border: { bottom: { color: "222222", size: 12, style: BorderStyle.SINGLE } }, children: [new TextRun("")] })]),
    ];
    const harvardDoc = new Document({
      styles: {
        default: { document: { run: { font: "Times New Roman", size: 18 } } },
        paragraphStyles: [{ id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", bold: true, color: "171717" } }],
      },
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 560, right: 720, bottom: 560, left: 720 },
          },
        },
        children: [...harvardHeader, ...(orderedRight.length ? orderedRight : [new Paragraph("")])],
      }],
    });
    const harvardBlob = await Packer.toBlob(harvardDoc);
    download(harvardBlob, `${slugName(filename || data.name)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    return;
  }

  const pageWidthTwips = 11906;
  const pageHeightTwips = 16838;
  const topRowHeight = isMinimal ? 40 : isModern ? 180 : 500;
  const bottomRowHeight = isMinimal ? 40 : isModern ? 160 : 300;
  // Word needs room for its mandatory paragraph after a table. Making the
  // rows add up to the exact page height causes it to move whole rows onto
  // additional pages even though the table visually fits on a single sheet.
  // Word keeps a small non-printing pagination area even with zero page
  // margins. Reserve enough room so the fixed bottom band stays on page one.
  const wordPaginationReserve = 520;
  const bodyMinHeight = pageHeightTwips - topRowHeight - bottomRowHeight - wordPaginationReserve;
  const sidebarWidthTwips = Math.round(pageWidthTwips * sidebarPercent / 100);
  const mainWidthTwips = pageWidthTwips - sidebarWidthTwips;
  const cellMargins = { top: 180, bottom: 180, left: 180, right: 180 };
  const topSidebarCell = new TableCell({
    width: { size: sidebarWidthTwips, type: WidthType.DXA },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    shading: isMinimal ? undefined : { fill: accent, type: ShadingType.CLEAR },
    children: [new Paragraph("")],
  });
  const topMainCell = new TableCell({
    width: { size: mainWidthTwips, type: WidthType.DXA },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    shading: isModern ? { fill: accent, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph("")],
  });
  const bodySidebarCell = new TableCell({
    width: { size: sidebarWidthTwips, type: WidthType.DXA },
    margins: cellMargins,
    shading: isMinimal ? undefined : { fill: hasDarkSidebar ? primary : isModern ? "F5F7F9" : "F1F3F5", type: ShadingType.CLEAR },
    children: left,
  });
  const bodyMainCell = new TableCell({
    width: { size: mainWidthTwips, type: WidthType.DXA },
    margins: { ...cellMargins, left: 260 },
    children: orderedRight.length ? orderedRight : [new Paragraph("")],
  });
  const bottomSidebarCell = new TableCell({
    width: { size: sidebarWidthTwips, type: WidthType.DXA },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    shading: isModern ? { fill: primary, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph("")],
  });
  const bottomMainCell = new TableCell({
    width: { size: mainWidthTwips, type: WidthType.DXA },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    shading: isMinimal ? undefined : { fill: hasDarkSidebar ? accent : primary, type: ShadingType.CLEAR },
    children: [new Paragraph("")],
  });
  const table = new Table({
    width: { size: pageWidthTwips, type: WidthType.DXA },
    columnWidths: isRight
      ? [mainWidthTwips, sidebarWidthTwips]
      : [sidebarWidthTwips, mainWidthTwips],
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
        height: { value: topRowHeight, rule: HeightRule.EXACT },
        children: isRight ? [topMainCell, topSidebarCell] : [topSidebarCell, topMainCell],
      }),
      new TableRow({
        height: { value: bodyMinHeight, rule: HeightRule.ATLEAST },
        children: isRight ? [bodyMainCell, bodySidebarCell] : [bodySidebarCell, bodyMainCell],
      }),
      new TableRow({
        height: { value: bottomRowHeight, rule: HeightRule.EXACT },
        children: isRight ? [bottomMainCell, bottomSidebarCell] : [bottomSidebarCell, bottomMainCell],
      }),
    ],
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: docxFont, size: 18 } } },
      paragraphStyles: [
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: docxFont, bold: true, color: primary },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: pageWidthTwips, height: pageHeightTwips },
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
          },
        },
        children: [
          table,
          new Paragraph({
            spacing: { before: 0, after: 0, line: 1 },
            children: [new TextRun({ text: "\u200B", size: 2 })],
          }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  download(blob, `${slugName(filename || data.name)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

export async function exportPdf(data: CvData, labels: ExportLabels, filename?: string) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const pdfFonts = data.fontFamily === "serif" || data.fontFamily === "times"
    ? [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic]
    : [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique];
  const regular = await pdf.embedFont(pdfFonts[0]);
  const bold = await pdf.embedFont(pdfFonts[1]);
  const italic = await pdf.embedFont(pdfFonts[2]);
  const color = pdfColor(data.primaryColor, [23 / 255, 59 / 255, 99 / 255], rgb) as ReturnType<typeof rgb>;
  const accent = pdfColor(data.accentColor, [60 / 255, 101 / 255, 150 / 255], rgb) as ReturnType<typeof rgb>;
  const dark = rgb(24 / 255, 30 / 255, 38 / 255);
  const muted = rgb(0.94, 0.95, 0.96);
  const white = rgb(1, 1, 1);
  const isContrastPdf = data.template === "contrast";
  const isCompactPdf = data.template === "compact";
  const isEditorialPdf = data.template === "editorial";
  const isHarvardPdf = data.template === "harvard";
  const isHorizontalPdf = isCompactPdf || isContrastPdf;
  const horizontalContentLoad =
    safe(data.summary).length / 85 +
    data.experiences.reduce((total, item) => total + 1.5 + item.bullets.filter((bullet) => safe(bullet)).reduce((sum, bullet) => sum + Math.max(1, safe(bullet).length / 75), 0), 0) +
    data.skills.filter((skill) => safe(skill.name)).length * 0.7 +
    data.education.filter((item) => safe(item.institution) || safe(item.degree)).length * 1.2 +
    data.certifications.filter((item) => safe(item.name) || safe(item.issuer)).length +
    data.customSections.reduce((total, section) => total + (section.type === "text" ? safe(section.text).length / 85 : section.items.filter((item) => safe(item.text)).length * 0.75), 0);
  const horizontalDense = isHorizontalPdf && horizontalContentLoad > 21;
  const horizontalBodyScale = horizontalDense ? 0.78 : 1;
  const hasDarkSidebarPdf = data.template === "right" || isEditorialPdf;
  const sidebarInk = hasDarkSidebarPdf ? white : dark;
  const pageWidth = 595.28;
  const sidebarWidth = isHarvardPdf || isHorizontalPdf ? 0 : isEditorialPdf ? 226 : data.template === "right" ? 179 : 202;
  const mainWidth = pageWidth - sidebarWidth;
  const isRight = data.template === "right";
  const sidebarX = isRight ? mainWidth : 0;
  const mainX = isRight ? 0 : sidebarWidth;
  const sidebarContentX = sidebarX + 20;
  const sidebarContentWidth = sidebarWidth - 40;
  const mainContentX = isHarvardPdf || isHorizontalPdf ? 42 : mainX + 24;
  const mainContentWidth = isHarvardPdf || isHorizontalPdf ? pageWidth - 84 : mainWidth - 48;
  const bulletX = mainContentX + 5;
  const bulletTextX = mainContentX + 15;
  const columnBoundary = isRight ? mainWidth : sidebarWidth;

  if (isHorizontalPdf) {
    const headerBottom = horizontalDense ? 692 : 652;
    page.drawRectangle({ x: 0, y: headerBottom, width: pageWidth, height: 841.89 - headerBottom, color: isContrastPdf ? color : muted });
    page.drawRectangle({ x: 0, y: 829, width: pageWidth, height: 12, color: accent });
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: 9, color: isContrastPdf ? accent : color });
  } else if (!isHarvardPdf && data.template !== "minimal") {
    page.drawRectangle({ x: sidebarX, y: 0, width: sidebarWidth, height: 841.89, color: hasDarkSidebarPdf ? color : muted });
    if (isEditorialPdf) {
      page.drawRectangle({ x: sidebarContentX, y: 806, width: 34, height: 6, color: accent });
    } else {
      page.drawRectangle({ x: data.template === "modern" ? 0 : sidebarX, y: data.template === "modern" ? 831 : 812, width: data.template === "modern" ? pageWidth : sidebarWidth, height: data.template === "modern" ? 11 : 30, color: accent });
    }
    page.drawRectangle({ x: data.template === "modern" ? 0 : mainX, y: 0, width: data.template === "modern" ? pageWidth : mainWidth, height: data.template === "modern" ? 10 : 18, color: hasDarkSidebarPdf ? accent : color });
    if (isEditorialPdf) {
      page.drawRectangle({ x: sidebarWidth - 5, y: 0, width: 5, height: 841.89, color: accent });
    }
  } else if (!isHarvardPdf) {
    page.drawLine({ start: { x: columnBoundary, y: 26 }, end: { x: columnBoundary, y: 816 }, thickness: 0.6, color: muted });
  }

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
    textColor = dark,
  ) => {
    const effectiveSize = size * (isHorizontalPdf ? horizontalBodyScale : 1);
    const effectiveLineHeight = lineHeight * (isHorizontalPdf ? horizontalBodyScale : 1);
    const lines = wrap(text, font, effectiveSize, width).slice(0, maxLines);
    lines.forEach((line, index) =>
      page.drawText(line, { x, y: y - index * effectiveLineHeight, size: effectiveSize, font, color: textColor }),
    );
    return y - lines.length * effectiveLineHeight;
  };
  const heading = (text: string, x: number, y: number, width: number, textColor = color, lineColor = color) => {
    page.drawText(text, { x, y, size: 16, font: bold, color: textColor });
    page.drawLine({ start: { x, y: y - 5 }, end: { x: x + width, y: y - 5 }, thickness: 0.7, color: lineColor });
    return y - 22;
  };
  const contacts = [
    [labels.location, data.location],
    [labels.phone, data.phone],
    [labels.email, data.email],
    [labels.portfolio, data.portfolio],
  ].filter(([, value]) => safe(value));
  const languages = data.languages.filter((item) => safe(item.name));

  if (isHorizontalPdf) {
    const headerInk = isContrastPdf ? white : color;
    page.drawText(safe(data.name).toUpperCase() || "TU NOMBRE", { x: 42, y: 790, size: 21, font: bold, color: headerInk });
    if (safe(data.headline)) page.drawText(safe(data.headline), { x: 42, y: 770, size: 9.5, font: bold, color: headerInk });
    let detailY = 790;
    if (contacts.length) {
      page.drawText(labels.contact.toUpperCase(), { x: 405, y: detailY, size: 8.4, font: bold, color: headerInk });
      page.drawLine({ start: { x: 405, y: detailY - 4 }, end: { x: 553, y: detailY - 4 }, thickness: 0.65, color: isContrastPdf ? accent : color });
      detailY -= 16;
    }
    contacts.slice(0, 4).forEach(([label, value]) => {
      page.drawText(`${label.toUpperCase()}:`, { x: 405, y: detailY, size: 6.7, font: bold, color: isContrastPdf ? accent : color });
      detailY = textBlock(safe(value), 405, detailY - 9, 148, 7.6, 9.5, regular, 2, isContrastPdf ? white : dark) - 3;
    });
    const languageText = languages.map((item) => `${item.name}: ${item.level}`).join("  |  ");
    if (languageText) {
      const languageY = horizontalDense ? 722 : 736;
      page.drawText(labels.languages.toUpperCase(), { x: 42, y: languageY, size: 8.4, font: bold, color: headerInk });
      page.drawLine({ start: { x: 42, y: languageY - 4 }, end: { x: 237, y: languageY - 4 }, thickness: 0.65, color: isContrastPdf ? accent : color });
      textBlock(languageText, 42, languageY - 16, 195, 7.8, 10, regular, 3, isContrastPdf ? white : dark);
    }
    if (data.photo) {
      try {
        const bytes = await dataUrlBytes(await cropPhoto(data.photo, data.photoShape));
        const image = data.photoShape === "round" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        const target = horizontalDense ? 82 : 104;
        page.drawImage(image, { x: horizontalDense ? 274 : 263, y: horizontalDense ? 704 : 696, width: target, height: data.photoShape === "round" ? target : target * 1.14 });
      } catch {
        // The CV still exports if an unsupported image slips through.
      }
    }
  } else if (!isHarvardPdf) {
  let leftY = 775;
  wrap(safe(data.name).toUpperCase() || "TU NOMBRE", bold, 20, sidebarContentWidth + 2)
    .slice(0, 2)
    .forEach((line, index) => page.drawText(line, { x: sidebarContentX, y: leftY - index * 24, size: 20, font: bold, color: hasDarkSidebarPdf ? white : color }));
  leftY -= safe(data.name).length > 16 ? 58 : 34;
  if (safe(data.headline)) {
    leftY = textBlock(data.headline, sidebarContentX, leftY, sidebarContentWidth + 2, 9, 11, bold, 2, sidebarInk) - 7;
  }
  if (data.photo) {
    try {
      const bytes = await dataUrlBytes(await cropPhoto(data.photo, data.photoShape));
      const image = data.photoShape === "round" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const targetW = sidebarContentWidth - 15;
      const targetH = data.photoShape === "round" ? targetW : targetW * 8 / 7;
      page.drawImage(image, { x: sidebarContentX, y: leftY - targetH, width: targetW, height: targetH });
      leftY -= targetH + 22;
    } catch {
      // The CV still exports if an unsupported image slips through.
    }
  }

  if (contacts.length) {
    leftY = heading(labels.contact, sidebarContentX, leftY, sidebarContentWidth, hasDarkSidebarPdf ? white : color, hasDarkSidebarPdf ? accent : color);
    contacts.forEach(([label, value]) => {
      page.drawText(`${label}:`, { x: sidebarContentX, y: leftY, size: 8.5, font: bold, color: sidebarInk });
      leftY = textBlock(value, sidebarContentX, leftY - 12, sidebarContentWidth, 8.2, 10, regular, 2, sidebarInk) - 7;
    });
  }
  if (languages.length) {
    leftY = heading(labels.languages, sidebarContentX, leftY - 3, sidebarContentWidth, hasDarkSidebarPdf ? white : color, hasDarkSidebarPdf ? accent : color);
    languages.forEach((item) => {
      page.drawText(`${item.name}:`, { x: sidebarContentX, y: leftY, size: 8.5, font: bold, color: sidebarInk });
      leftY = textBlock(item.level, sidebarContentX, leftY - 11, sidebarContentWidth, 8.2, 10, regular, 2, sidebarInk) - 5;
    });
  }
  }

  let rightY = isHarvardPdf ? 790 : isHorizontalPdf ? (horizontalDense ? 670 : 625) : 775;
  if (isHarvardPdf) {
    const centeredText = (text: string, y: number, size: number, font = regular) => {
      const width = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: Math.max(42, (pageWidth - width) / 2), y, size, font, color: dark });
    };
    centeredText(safe(data.name).toUpperCase() || "TU NOMBRE", rightY, 21, bold);
    rightY -= 25;
    if (safe(data.headline)) {
      centeredText(safe(data.headline), rightY, 10, regular);
      rightY -= 16;
    }
    const harvardContact = contacts.map(([, value]) => safe(value)).join("  |  ");
    if (harvardContact) {
      wrap(harvardContact, regular, 8.2, mainContentWidth).slice(0, 2).forEach((line) => {
        centeredText(line, rightY, 8.2, regular);
        rightY -= 11;
      });
    }
    const harvardLanguages = languages.map((item) => `${item.name}: ${item.level}`).join("  |  ");
    if (harvardLanguages) {
      wrap(harvardLanguages, regular, 8, mainContentWidth).slice(0, 2).forEach((line) => {
        centeredText(line, rightY, 8, regular);
        rightY -= 10;
      });
    }
    page.drawLine({ start: { x: mainContentX, y: rightY - 2 }, end: { x: mainContentX + mainContentWidth, y: rightY - 2 }, thickness: 1.1, color: dark });
    rightY -= 18;
  }
  let drawnMainSections = 0;
  const mainHeading = (label: string) => {
    const sectionGap = isHorizontalPdf ? 12 * horizontalBodyScale : 12;
    if (drawnMainSections > 0) rightY -= sectionGap;
    drawnMainSections += 1;
    if (isHarvardPdf) {
      page.drawText(label.toUpperCase(), { x: mainContentX, y: rightY, size: 10.5, font: bold, color: dark });
      page.drawLine({ start: { x: mainContentX, y: rightY - 3 }, end: { x: mainContentX + mainContentWidth, y: rightY - 3 }, thickness: 0.7, color: dark });
      return rightY - 16;
    }
    if (isEditorialPdf || isHorizontalPdf) {
      const headingHeight = isHorizontalPdf ? 21 * horizontalBodyScale : 21;
      const headingSize = isHorizontalPdf ? 13 * horizontalBodyScale : 13;
      page.drawRectangle({ x: mainContentX, y: rightY - 5 * horizontalBodyScale, width: mainContentWidth, height: headingHeight, color: muted });
      page.drawRectangle({ x: mainContentX, y: rightY - 5 * horizontalBodyScale, width: 4, height: headingHeight, color: accent });
      page.drawText(label.toUpperCase(), {
        x: mainContentX + 10,
        y: rightY,
        size: headingSize,
        font: regular,
        color,
      });
      return rightY - 26 * (isHorizontalPdf ? horizontalBodyScale : 1);
    }
    return heading(label, mainContentX, rightY, mainContentWidth);
  };
  const experiences = data.experiences.filter((item) => safe(item.company) || safe(item.role));
  const education = data.education.filter((item) => safe(item.institution) || safe(item.degree));
  const certifications = data.certifications.filter((item) => safe(item.name) || safe(item.issuer));
  const sectionDrawers: Record<MainSectionId, () => void> = {
    summary: () => {
      if (!safe(data.summary)) return;
      rightY = mainHeading(labels.summary);
      rightY = textBlock(data.summary, mainContentX, rightY, mainContentWidth, 9.5, 13, regular, 7) - 6;
    },
    experience: () => {
      if (!experiences.length || rightY <= 80) return;
      rightY = mainHeading(labels.experience);
      experiences.forEach((item) => {
        rightY = textBlock([safe(item.company), safe(item.role)].filter(Boolean).join(" — "), mainContentX, rightY, mainContentWidth, 9.5, 12, bold, 2);
        rightY = textBlock([safe(item.location), [safe(item.start), safe(item.end)].filter(Boolean).join(" – ")].filter(Boolean).join(" · "), mainContentX, rightY - 2, mainContentWidth, 8.5, 11, italic, 2);
        item.bullets.filter((bullet) => safe(bullet)).forEach((bullet) => {
          page.drawCircle({ x: bulletX, y: rightY + 3, size: 1.5, color: dark });
          rightY = textBlock(bullet, bulletTextX, rightY, mainContentWidth - 15, 8.6, 11, regular, 3);
        });
        rightY -= 8;
      });
    },
    education: () => {
      if (!education.length || rightY <= 80) return;
      rightY = mainHeading(labels.education);
      education.forEach((item) => {
        rightY = textBlock([safe(item.institution), safe(item.degree)].filter(Boolean).join(" — "), mainContentX, rightY, mainContentWidth, 9.2, 11, bold, 2);
        rightY = textBlock([safe(item.location), [safe(item.start), safe(item.end)].filter(Boolean).join(" – ")].filter(Boolean).join(" · "), mainContentX, rightY - 2, mainContentWidth, 8.3, 10, italic, 2) - 6;
      });
    },
    certifications: () => {
      if (!certifications.length || rightY <= 80) return;
      rightY = mainHeading(labels.certifications);
      certifications.forEach((item) => {
        rightY = textBlock(safe(item.name), mainContentX, rightY, mainContentWidth, 9, 11, bold, 2);
        rightY = textBlock([safe(item.issuer), safe(item.date)].filter(Boolean).join(" · "), mainContentX, rightY - 1, mainContentWidth, 8.3, 10, italic, 2) - 5;
      });
    },
    skills: () => {
      if (!data.skills.some((skill) => safe(skill.name)) || rightY <= 55) return;
      rightY = mainHeading(labels.skills);
      data.skills.map((skill) => skill.name.trim()).filter(Boolean).slice(0, 12).forEach((skill) => {
        page.drawCircle({ x: bulletX, y: rightY + 3, size: 1.5, color: dark });
        rightY = textBlock(skill, bulletTextX, rightY, mainContentWidth - 15, 9, 12, regular, 2);
      });
    },
  };
  normalizeContentOrder(data.contentOrder, data.sectionOrder, data.customSections).forEach((sectionId) => {
    if (mainSectionIds.includes(sectionId as MainSectionId)) {
      sectionDrawers[sectionId as MainSectionId]();
      return;
    }
    const section = data.customSections.find((item) => item.id === sectionId);
    if (!section || rightY <= 55) return;
    if (section.type === "text" && safe(section.text)) {
      rightY = mainHeading(safe(section.title) || "Section");
      rightY = textBlock(section.text, mainContentX, rightY, mainContentWidth, 9.5, 13, regular, 7) - 6;
    }
    if (section.type === "list" && section.items.some((item) => safe(item.text))) {
      rightY = mainHeading(safe(section.title) || "Section");
      section.items.filter((item) => safe(item.text)).slice(0, 8).forEach((item) => {
        page.drawCircle({ x: bulletX, y: rightY + 3, size: 1.5, color: dark });
        rightY = textBlock(item.text, bulletTextX, rightY, mainContentWidth - 15, 9, 12, regular, 2);
      });
    }
  });

  const bytes = await pdf.save();
  const pdfBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  download(pdfBuffer, `${slugName(filename?.trim() || data.name)}.pdf`, "application/pdf");
}
