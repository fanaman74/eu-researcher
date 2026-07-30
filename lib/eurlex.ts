/**
 * Shared helpers for querying the EUR-Lex Cellar SPARQL endpoint.
 * Extracted from the chat and eurlex API routes to avoid duplication.
 */

/**
 * Sanitize a user-supplied keyword for safe SPARQL string interpolation.
 * Escapes characters that could break out of a SPARQL string literal and
 * rejects any keyword containing control characters or query syntax markers.
 */
export function sanitizeForSparql(raw: string): string {
  const s = raw
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "")
    .replace(/\n/g, "");
  // Whitelist: only alphanumerics, spaces, and safe punctuation
  if (!/^[a-zA-Z0-9 _\-.,'/]+$/.test(s)) {
    return s.replace(/[^a-zA-Z0-9 _\-.,']/g, "");
  }
  return s;
}

export function getSectorFromCelex(celex: string): string {
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

/** Base stop words stripped from search queries before building SPARQL filters. */
export const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for", "with", "by", "about", "against"
]);

/**
 * Coerce an untrusted top_k value into a safe integer range (1-50, default 5)
 * before it is interpolated into a SPARQL LIMIT clause.
 */
export function clampTopK(raw: unknown): number {
  return Math.min(Math.max(parseInt(String(raw), 10) || 5, 1), 50);
}

export interface EurlexHit {
  id: string;
  title: string;
  country: string;
  sector: string;
  url: string;
  snippet: string;
}

/**
 * Execute a title-keyword search against the EUR-Lex SPARQL endpoint.
 * `sectorFilter` / `courtFilter` are caller-built SPARQL FILTER clauses
 * (empty string when unused); `keywordFilters` must already be sanitized.
 */
export async function executeQuery(
  keywordFilters: string,
  top_k: number,
  sectorFilter: string,
  courtFilter: string = ""
): Promise<EurlexHit[]> {
  const sparqlQuery = `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

    SELECT DISTINCT ?work ?celex ?title ?date
    WHERE {
      ?work cdm:resource_legal_id_celex ?celex .
      ?expr cdm:expression_belongs_to_work ?work .
      ?expr cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
      ?expr cdm:expression_title ?title .
      
      OPTIONAL { ?work cdm:work_date_document ?date . }
      OPTIONAL { ?work cdm:work_created_by_agent ?courtAgent . }
      
      ${sectorFilter}
      ${courtFilter}
      FILTER(${keywordFilters})
    }
    ORDER BY DESC(?date)
    LIMIT ${top_k}
  `;

  const endpoint = 'https://publications.europa.eu/webapi/rdf/sparql';
  const url = `${endpoint}?query=${encodeURIComponent(sparqlQuery)}&format=application%2Fsparql-results%2Bjson`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/sparql-results+json' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    throw new Error(`SPARQL endpoint returned status: ${response.status}`);
  }
  const data = await response.json();

  return data.results.bindings.map((b: any) => {
    const celex = b.celex.value;
    const sector = getSectorFromCelex(celex);
    return {
      id: celex,
      title: b.title.value,
      country: "EU",
      sector: sector,
      url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`,
      snippet: `[${sector}] EUR-Lex official record. CELEX identifier: ${celex}. Document Date: ${b.date ? b.date.value : "N/A"}. Work Cellar URI: ${b.work.value}.`
    };
  });
}
