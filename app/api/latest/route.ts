import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentYear = new Date().getFullYear();
  // Query from start of last year to get fresh live documents
  const dateLimit = `${currentYear - 1}-01-01`;

  const sparqlQuery = `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

    SELECT DISTINCT ?work ?celex ?title ?date
    WHERE {
      ?work cdm:resource_legal_id_celex ?celex .
      ?expr cdm:expression_belongs_to_work ?work .
      ?expr cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
      ?expr cdm:expression_title ?title .
      ?work cdm:work_date_document ?date .
      FILTER(STRSTARTS(?celex, "6") || STRSTARTS(?celex, "3"))
      FILTER(?date >= "${dateLimit}"^^<http://www.w3.org/2001/XMLSchema#date>)
    }
    ORDER BY DESC(?date)
    LIMIT 8
  `;

  const endpoint = 'https://publications.europa.eu/webapi/rdf/sparql';
  const url = `${endpoint}?query=${encodeURIComponent(sparqlQuery)}&format=application%2Fsparql-results%2Bjson`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/sparql-results+json' },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`SPARQL returned status: ${response.status}`);
    }

    const data = await response.json();
    const documents = data.results.bindings.map((b: any) => {
      const celex = b.celex.value;
      let sectorName = "Secondary Legislation";
      if (celex.startsWith("6")) {
        sectorName = "Case Law";
      } else if (celex.startsWith("1")) {
        sectorName = "Primary Law";
      } else if (celex.startsWith("5")) {
        sectorName = "Preparatory Document";
      }

      return {
        celex,
        title: b.title.value,
        date: b.date ? b.date.value : "N/A",
        sector: sectorName,
        url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`,
        snippet: `EUR-Lex official record. CELEX identifier: ${celex}. Document Date: ${b.date ? b.date.value : "N/A"}. Work Cellar URI: ${b.work.value}.`
      };
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Latest Documents Route Error:", error);
    return NextResponse.json({ error: error.message, documents: [] });
  }
}
