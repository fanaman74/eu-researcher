/**
 * Client-side Word (.docx) and PowerPoint (.pptx) exports for briefing documents.
 * A briefing is a title plus sections of headed lines, so the same content can be
 * exported either way. `docx` is imported on demand; pptxgenjs comes from the CDN
 * loader shared with lib/generatePptx.ts.
 */
import { loadPptxScript } from "./generatePptx";

export interface BriefingDoc {
  title: string;
  subtitle: string;
  sections: { heading: string; lines: string[] }[];
  /** Source attribution printed at the end. */
  source: string;
}

const fileName = (title: string, ext: string) => `${title.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").toLowerCase()}.${ext}`;

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadDocx(doc: BriefingDoc) {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
  const children = [
    new Paragraph({ text: doc.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: doc.subtitle, color: "555555" })], spacing: { after: 240 } }),
  ];
  for (const s of doc.sections) {
    children.push(new Paragraph({ text: s.heading, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 } }));
    const lines = s.lines.length > 0 ? s.lines : ["None."];
    for (const line of lines) children.push(new Paragraph({ text: line, bullet: { level: 0 } }));
  }
  children.push(new Paragraph({ children: [new TextRun({ text: doc.source, italics: true, size: 16, color: "777777" })], spacing: { before: 360 } }));

  const file = new Document({ creator: "EU Researcher", title: doc.title, sections: [{ children }] });
  save(await Packer.toBlob(file), fileName(doc.title, "docx"));
}

/** One slide per ~12 lines, so a one-page briefing normally fits a single slide per two sections. */
export async function downloadPptx(doc: BriefingDoc) {
  await loadPptxScript();
  const PptxGenJS = (window as any).PptxGenJS;
  if (!PptxGenJS) throw new Error("Failed to load the PowerPoint library.");
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.title = doc.title;

  const DARK = "0F172A";
  const BLUE = "2563EB";
  const MUTED = "64748B";
  const LINES_PER_SLIDE = 12;

  // Pack whole sections onto slides; a long section continues on the next slide.
  const slides: { heading: string; lines: string[] }[][] = [[]];
  let used = 0;
  for (const s of doc.sections) {
    const lines = s.lines.length > 0 ? s.lines : ["None."];
    for (let i = 0; i < lines.length; i += LINES_PER_SLIDE) {
      const chunk = lines.slice(i, i + LINES_PER_SLIDE);
      if (used > 0 && used + chunk.length + 1 > LINES_PER_SLIDE) {
        slides.push([]);
        used = 0;
      }
      slides[slides.length - 1].push({ heading: i === 0 ? s.heading : `${s.heading} (continued)`, lines: chunk });
      used += chunk.length + 1;
    }
  }

  slides.forEach((sections, n) => {
    const slide = pres.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: BLUE } });
    slide.addText(doc.title, { x: 0.5, y: 0.25, w: 9, h: 0.45, fontSize: 20, bold: true, color: DARK, fontFace: "Calibri", margin: 0 });
    slide.addText(n === 0 ? doc.subtitle : `${doc.subtitle} — page ${n + 1}`, { x: 0.5, y: 0.7, w: 9, h: 0.3, fontSize: 11, color: MUTED, fontFace: "Calibri", margin: 0 });

    const runs = sections.flatMap((s) => [
      { text: s.heading.toUpperCase(), options: { bold: true, color: BLUE, fontSize: 10, breakLine: true, paraSpaceBefore: 8 } },
      ...s.lines.map((line) => ({ text: line, options: { bullet: true, color: DARK, fontSize: 10, breakLine: true } })),
    ]);
    slide.addText(runs, { x: 0.5, y: 1.1, w: 9, h: 3.95, fontFace: "Calibri", valign: "top", margin: 0 });
    slide.addText(doc.source, { x: 0.5, y: 5.2, w: 9, h: 0.3, fontSize: 8, italic: true, color: MUTED, fontFace: "Calibri", margin: 0 });
  });

  await pres.writeFile({ fileName: fileName(doc.title, "pptx") });
}
