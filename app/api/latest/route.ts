import { NextRequest, NextResponse } from "next/server";

const PREFIX_MAP: Record<string, string> = {
  consolidated: "0",
  international: "1",
  agreements: "2",
  statutes: "3",
  complementary: "4",
  regulatory: "5",
  case_law: "6",
  transposition: "7",
  national_case_law: "8",
  parliamentary: "9"
};

const SECTOR_NAMES: Record<string, string> = {
  consolidated: "Consolidated Texts",
  international: "Primary Law & Treaties",
  agreements: "International Agreements",
  statutes: "Secondary Legislation",
  complementary: "Complementary Legislation",
  regulatory: "Preparatory Documents",
  case_law: "Case Law",
  transposition: "National Transposition",
  national_case_law: "National Case-Law",
  parliamentary: "Parliamentary Questions"
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const namespace = searchParams.get("namespace") || "case_law";
  const sectorPrefix = PREFIX_MAP[namespace] || "6";
  const sectorLabel = SECTOR_NAMES[namespace] || "Case Law";

  const currentYear = new Date().getFullYear();
  // Query from start of 3 years ago, but relax for parliamentary questions since the database contains them up to 2014
  const dateLimit = namespace === "parliamentary" ? "2010-01-01" : `${currentYear - 3}-01-01`;

  const sparqlQuery = `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

    SELECT DISTINCT ?work ?celex ?title ?date
    WHERE {
      ?work cdm:resource_legal_id_celex ?celex .
      ?expr cdm:expression_belongs_to_work ?work .
      ?expr cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
      ?expr cdm:expression_title ?title .
      ?work cdm:work_date_document ?date .
      FILTER(STRSTARTS(?celex, "${sectorPrefix}"))
      FILTER(?date >= "${dateLimit}"^^<http://www.w3.org/2001/XMLSchema#date>)
    }
    ORDER BY DESC(?date)
    LIMIT 10
  `;

  const endpoint = 'https://publications.europa.eu/webapi/rdf/sparql';
  const url = `${endpoint}?query=${encodeURIComponent(sparqlQuery)}&format=application%2Fsparql-results%2Bjson`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/sparql-results+json' },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 43200 } // Cache for 12 hours (Twice Daily)
    });

    if (!response.ok) {
      throw new Error(`SPARQL returned status: ${response.status}`);
    }

    const data = await response.json();
    const documents = data.results.bindings.map((b: any) => {
      const celex = b.celex.value;
      return {
        celex,
        title: b.title.value,
        date: b.date ? b.date.value : "N/A",
        sector: sectorLabel,
        url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`,
        snippet: `EUR-Lex official record. CELEX identifier: ${celex}. Document Date: ${b.date ? b.date.value : "N/A"}. Work Cellar URI: ${b.work.value}.`
      };
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Latest Documents Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve latest documents.", documents: [] });
  }
}
