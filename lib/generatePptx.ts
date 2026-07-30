// @ts-nocheck — pptxgenjs loaded at runtime from CDN; no local types available
/**
 * Generates a McKinsey-style executive presentation from political event analysis.
 * Loads pptxgenjs from CDN at runtime (avoids Node.js bundling issues).
 */

declare global {
  interface Window {
    PptxGenJS: any;
  }
}

// Pinned CDN bundle with SRI: pptxgenjs is loaded client-side at runtime so it
// (and its jszip dependency) stays out of the Node.js/server bundle entirely.
const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
const SCRIPT_INTEGRITY = "sha384-Cck14aA9cifjYolcnjebXRfWGkz5ltHMBiG4px/j8GS+xQcb7OhNQWZYyWjQ+UwQ";

function loadPptxScript(): Promise<void> {
  if (window.PptxGenJS) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.integrity = SCRIPT_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function generateAnalysisPptx(
  event: {
    id: string;
    title: string;
    description: string;
    content: string;
    date: string;
    sourceType: string;
    sourceName: string;
    sourceUrl: string;
    category: string;
    impactLevel: string;
    entities: { name: string; role: string; party: string }[];
    tags: string[];
  },
  analysisText: string
) {
  await loadPptxScript();
  const PptxGenJS = window.PptxGenJS;
  if (!PptxGenJS) throw new Error("Failed to load PptxGenJS library");

  const pres = new PptxGenJS();

  pres.author = "EU Researcher - Political Intelligence Platform";
  pres.title = `Legislative Analysis: ${event.title}`;
  pres.layout = "LAYOUT_16x9";
  pres.subject = "Italian Political Event Analysis";

  // Color palette — vibrant modern (deep indigo / teal / coral rose)
  const C: Record<string, string> = {
    primary: "2D1B69",
    secondary: "0891B2",
    accent: "F43F5E",
    success: "059669",
    warning: "F59E0B",
    dark: "0F172A",
    light: "F8FAFC",
    muted: "64748B",
    white: "FFFFFF",
  };

  const mkShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.15 });

  const impactColor =
    event.impactLevel === "High"
      ? C.accent
      : event.impactLevel === "Medium"
      ? C.warning
      : C.success;

  const eventDate = new Date(event.date).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // ── SLIDE 1: TITLE (dark) ──────────────────────────────────────────────
  const s1 = pres.addSlide();
  s1.background = { color: C.dark };

  s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.12, fill: { color: C.secondary } });

  s1.addText("LEGISLATIVE INTELLIGENCE BRIEFING", {
    x: 0.8, y: 1.2, w: 8.4, h: 0.6,
    fontSize: 30, fontFace: "Arial Black", color: C.white, bold: true, charSpacing: 4, margin: 0,
  });

  s1.addText(event.title, {
    x: 0.8, y: 2.0, w: 8.4, h: 1.0,
    fontSize: 20, fontFace: "Calibri", color: C.secondary, bold: true, margin: 0,
  });

  // Meta cards
  s1.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.5, w: 4, h: 0.8, fill: { color: C.primary }, shadow: mkShadow() });
  s1.addText([
    { text: "SOURCE\n", options: { fontSize: 9, color: C.muted, breakLine: true } },
    { text: event.sourceName, options: { fontSize: 12, color: C.white, bold: true } },
  ], { x: 1.0, y: 3.6, w: 3.6, h: 0.6, valign: "middle" });

  s1.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 3.5, w: 4, h: 0.8, fill: { color: C.primary }, shadow: mkShadow() });
  s1.addText([
    { text: "DATE\n", options: { fontSize: 9, color: C.muted, breakLine: true } },
    { text: eventDate, options: { fontSize: 12, color: C.white, bold: true } },
  ], { x: 5.4, y: 3.6, w: 3.6, h: 0.6, valign: "middle" });

  // Impact bar
  s1.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.6, w: 8.4, h: 0.5, fill: { color: impactColor }, shadow: mkShadow() });
  s1.addText(`${event.impactLevel.toUpperCase()} STRATEGIC IMPACT  —  ${event.category}`, {
    x: 0.8, y: 4.6, w: 8.4, h: 0.5,
    fontSize: 14, fontFace: "Calibri", color: C.white, bold: true, align: "center", valign: "middle",
  });

  // ── SLIDE 2: EXECUTIVE SUMMARY (light) ─────────────────────────────────
  const s2 = pres.addSlide();
  s2.background = { color: C.light };
  s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.75, fill: { color: C.primary } });
  s2.addText("EXECUTIVE SUMMARY", {
    x: 0.8, y: 0, w: 8.4, h: 0.75,
    fontSize: 20, fontFace: "Arial Black", color: C.white, bold: true, valign: "middle", margin: 0,
  });

  s2.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.1, w: 8.4, h: 1.8, fill: { color: C.white }, shadow: mkShadow() });
  s2.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.1, w: 0.08, h: 1.8, fill: { color: C.secondary } });
  s2.addText(event.description, {
    x: 1.1, y: 1.2, w: 7.9, h: 1.6,
    fontSize: 13, fontFace: "Calibri", color: C.dark, valign: "top", margin: 0,
  });

  // Key content card
  s2.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.1, w: 8.4, h: 1.8, fill: { color: C.white }, shadow: mkShadow() });
  s2.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.1, w: 0.08, h: 1.8, fill: { color: C.accent } });
  s2.addText(event.content.length > 800 ? event.content.substring(0, 800) + "..." : event.content, {
    x: 1.1, y: 3.2, w: 7.9, h: 1.5,
    fontSize: 11, fontFace: "Calibri", color: C.dark, valign: "top", margin: 0,
  });

  // Tags footer
  if (event.tags.length > 0) {
    s2.addText("KEY THEMES    " + event.tags.map(t => `#${t}`).join("   "), {
      x: 0.8, y: 5.1, w: 8.4, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: C.secondary, bold: true,
    });
  }

  // ── SLIDE 3+: STRATEGIC BRIEFING (light) ───────────────────────────────
  const addBriefingSlide = (text: string, subtitle: string) => {
    const s = pres.addSlide();
    s.background = { color: C.light };
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.75, fill: { color: C.primary } });
    s.addText(subtitle, {
      x: 0.8, y: 0, w: 8.4, h: 0.75,
      fontSize: 20, fontFace: "Arial Black", color: C.white, bold: true, valign: "middle", margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.1, w: 8.4, h: 4.0, fill: { color: C.white }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.1, w: 0.08, h: 4.0, fill: { color: C.warning } });
    s.addText(text, {
      x: 1.1, y: 1.3, w: 7.8, h: 3.6,
      fontSize: 11, fontFace: "Calibri", color: C.dark, valign: "top", margin: 0,
    });
    return s;
  };

  const CHUNK = 1800;
  const chunks: string[] = [];
  for (let i = 0; i < analysisText.length; i += CHUNK) {
    chunks.push(analysisText.substring(i, i + CHUNK));
  }
  addBriefingSlide(chunks[0] || analysisText, "STRATEGIC BRIEFING");
  for (let i = 1; i < chunks.length; i++) {
    addBriefingSlide(chunks[i], `STRATEGIC BRIEFING (CONTINUED ${i})`);
  }

  // ── SLIDE 4: STAKEHOLDER ANALYSIS (light) ─────────────────────────────
  const s4 = pres.addSlide();
  s4.background = { color: C.light };
  s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.75, fill: { color: C.primary } });
  s4.addText("STAKEHOLDER ANALYSIS", {
    x: 0.8, y: 0, w: 8.4, h: 0.75,
    fontSize: 20, fontFace: "Arial Black", color: C.white, bold: true, valign: "middle", margin: 0,
  });

  if (event.entities.length > 0) {
    const partyColors: Record<string, string> = {
      FdI: C.accent, PD: C.secondary, M5S: C.warning, Lega: C.success, FI: C.primary, Other: C.muted,
    };

    const rows = [
      [
        { text: "STAKEHOLDER", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 11 } },
        { text: "ROLE", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 11 } },
        { text: "AFFILIATION", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 11 } },
      ],
    ];

    event.entities.forEach((entity: any, idx: number) => {
      const bg = idx % 2 === 0 ? C.white : "F1F5F9";
      rows.push([
        { text: entity.name, options: { fill: { color: bg }, fontSize: 11, bold: true, color: C.dark } },
        { text: entity.role, options: { fill: { color: bg }, fontSize: 10, color: C.muted } },
        { text: entity.party, options: { fill: { color: bg }, fontSize: 11, bold: true, color: partyColors[entity.party] || C.muted } },
      ]);
    });

    s4.addTable(rows, {
      x: 0.8, y: 1.1, w: 8.4,
      colW: [3.5, 3.5, 1.4],
      border: { pt: 0.5, color: "E2E8F0" },
      rowH: [0.4, ...Array(event.entities.length).fill(0.45)],
      valign: "middle",
    });

    // Coalition insight bar
    const parties = new Set(event.entities.map(e => e.party));
    s4.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.5, w: 8.4, h: 0.65, fill: { color: C.secondary }, shadow: mkShadow() });
    s4.addText(
      `Coalition Dynamics: ${event.entities.length} key actors across ${parties.size} political faction${parties.size > 1 ? "s" : ""} — ${Array.from(parties).join(", ")}`,
      { x: 0.8, y: 4.5, w: 8.4, h: 0.65, fontSize: 12, fontFace: "Calibri", color: C.white, bold: true, align: "center", valign: "middle" }
    );
  } else {
    s4.addText("No specific stakeholders identified for this event.", {
      x: 0.8, y: 2.5, w: 8.4, h: 0.5,
      fontSize: 14, fontFace: "Calibri", color: C.muted, italic: true, align: "center",
    });
  }

  // ── SLIDE 5: RISK & RECOMMENDATIONS (dark) ────────────────────────────
  const s5 = pres.addSlide();
  s5.background = { color: C.dark };
  s5.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.75, fill: { color: impactColor } });
  s5.addText("RISK ASSESSMENT & ADVOCACY PATH", {
    x: 0.8, y: 0, w: 8.4, h: 0.75,
    fontSize: 20, fontFace: "Arial Black", color: C.white, bold: true, valign: "middle", margin: 0,
  });

  // Impact callout
  s5.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.1, w: 4, h: 2.2, fill: { color: impactColor }, shadow: mkShadow() });
  s5.addText([
    { text: `${event.impactLevel.toUpperCase()}\n`, options: { fontSize: 36, bold: true, color: C.white, breakLine: true } },
    { text: "STRATEGIC IMPACT", options: { fontSize: 14, color: C.white } },
  ], { x: 0.8, y: 1.1, w: 4, h: 2.2, align: "center", valign: "middle" });

  // Category card
  s5.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.1, w: 4, h: 2.2, fill: { color: C.white }, shadow: mkShadow() });
  s5.addText([
    { text: "CATEGORY\n", options: { fontSize: 10, color: C.muted, breakLine: true } },
    { text: event.category, options: { fontSize: 18, color: C.dark, bold: true } },
  ], { x: 5.2, y: 1.1, w: 4, h: 2.2, align: "center", valign: "middle" });

  // Recommendations
  s5.addText("ADVOCACY RECOMMENDATIONS", {
    x: 0.8, y: 3.6, w: 8.4, h: 0.35,
    fontSize: 13, fontFace: "Calibri", color: C.secondary, bold: true, margin: 0,
  });

  const recs = [
    "Monitor legislative progression through committee stages",
    "Engage key stakeholders identified in stakeholder analysis",
    "Prepare coalition-building strategy across party lines",
    "Assess regulatory impact on operational frameworks",
  ];

  s5.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.0, w: 8.4, h: 1.2, fill: { color: C.white }, shadow: mkShadow() });
  s5.addText(
    recs.map((r, i) => ({
      text: r,
      options: { bullet: true, fontSize: 11, color: C.dark, breakLine: i < recs.length - 1, paraSpaceAfter: 4 },
    })),
    { x: 1.1, y: 4.1, w: 7.8, h: 1.0, valign: "top" }
  );

  // ── SLIDE 6: SOURCE CLOSING (dark) ────────────────────────────────────
  const s6 = pres.addSlide();
  s6.background = { color: C.dark };
  s6.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.475, w: 10, h: 0.15, fill: { color: C.secondary } });

  s6.addText("SOURCE DOCUMENTATION", {
    x: 0.8, y: 1.0, w: 8.4, h: 0.5,
    fontSize: 18, fontFace: "Arial Black", color: C.white, bold: true, align: "center",
  });

  s6.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: 1.8, w: 7, h: 0.65, fill: { color: C.primary }, shadow: mkShadow() });
  s6.addText(event.sourceUrl, {
    x: 1.5, y: 1.8, w: 7, h: 0.65,
    fontSize: 10, fontFace: "Calibri", color: C.secondary, align: "center", valign: "middle",
  });

  s6.addText("Generated by EU Researcher Political Intelligence Platform", {
    x: 0.8, y: 3.0, w: 8.4, h: 0.35,
    fontSize: 12, fontFace: "Calibri", color: C.muted, align: "center",
  });

  s6.addText(today, {
    x: 0.8, y: 3.4, w: 8.4, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.muted, align: "center",
  });

  // ── GENERATE & DOWNLOAD ────────────────────────────────────────────────
  const fileName = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_legislative_analysis.pptx`;
  await pres.writeFile({ fileName });
}
