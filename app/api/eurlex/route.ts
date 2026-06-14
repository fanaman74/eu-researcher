import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Sanitize a user-supplied keyword for safe SPARQL string interpolation.
 */
function sanitizeForSparql(raw: string): string {
  const s = raw
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "")
    .replace(/\n/g, "");
  if (!/^[a-zA-Z0-9 _\-.,'/]+$/.test(s)) {
    return s.replace(/[^a-zA-Z0-9 _\-.,']/g, "");
  }
  return s;
}

function getSectorFromCelex(celex: string): string {
  const first = celex.charAt(0);
  switch (first) {
    case "0": return "Consolidated Texts";
    case "1": return "Primary Law & Treaties";
    case "2": return "International Agreements";
    case "3": return "Secondary Legislation";
    case "4": return "Complementary Legislation";
    case "5": return "Preparatory Documents";
    case "6": return "Case Law";
    case "7": return "National Transposition";
    case "8": return "National Case-Law";
    case "9": return "Parliamentary Questions";
    default: return "Other Legal Document";
  }
}

async function executeQuery(keywordFilters: string, top_k: number) {
  const sparqlQuery = `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

    SELECT DISTINCT ?work ?celex ?title ?date
    WHERE {
      ?work cdm:resource_legal_id_celex ?celex .
      ?expr cdm:expression_belongs_to_work ?work .
      ?expr cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
      ?expr cdm:expression_title ?title .
      
      OPTIONAL { ?work cdm:work_date_document ?date . }
      
      FILTER(STRSTARTS(?celex, "3") || STRSTARTS(?celex, "6") || STRSTARTS(?celex, "5"))
      FILTER(${keywordFilters})
    }
    ORDER BY DESC(?date)
    LIMIT ${top_k}
  `;

  const endpoint = 'https://publications.europa.eu/webapi/rdf/sparql';
  const url = `${endpoint}?query=${encodeURIComponent(sparqlQuery)}&format=application%2Fsparql-results%2Bjson`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/sparql-results+json' }
  });
  if (!response.ok) {
    throw new Error(`SPARQL endpoint status: ${response.status}`);
  }
  const data = await response.json();
  
  return data.results.bindings.map((b: any, idx: number) => {
    const celex = b.celex.value;
    const sector = getSectorFromCelex(celex);
    return {
      id: celex,
      title: b.title.value,
      score: 0.98 - idx * 0.05,
      country: "EU",
      sector: sector,
      url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`,
      snippet: `[${sector}] EUR-Lex record. Identifier: ${celex}. Document Date: ${b.date ? b.date.value : "N/A"}. Work Cellar URI: ${b.work.value}.`
    };
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "energy";
    const top_k = parseInt(searchParams.get("top_k") || "5");

    const stopWords = new Set(["the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for", "with", "by", "about", "against"]);
    const keywords = q.toLowerCase()
      .split(/[\s,.\-\/]+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    if (keywords.length === 0) {
      keywords.push(q.toLowerCase());
    }

    const safeKeywords = keywords.map(sanitizeForSparql);

    // 1. Try high-precision AND search first
    const andFilters = safeKeywords.map(kw => `CONTAINS(LCASE(?title), "${kw}")`).join(" && ");
    let hits = await executeQuery(andFilters, top_k);
    
    // 2. If no hits, fallback to OR search
    if (hits.length === 0 && safeKeywords.length > 1) {
      const orFilters = safeKeywords.map(kw => `CONTAINS(LCASE(?title), "${kw}")`).join(" || ");
      hits = await executeQuery(orFilters, top_k);
    }

    return NextResponse.json({ hits });
  } catch (error: any) {
    console.error("SPARQL search error:", error);
    return NextResponse.json({ error: error.message || "Failed to search EUR-Lex SPARQL Cellar database." }, { status: 500 });
  }
}
