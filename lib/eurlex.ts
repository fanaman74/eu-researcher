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

export const CELLAR_SPARQL_ENDPOINT = "https://publications.europa.eu/webapi/rdf/sparql";

/** Run a SPARQL query against Cellar with a generous timeout and one retry on timeout/5xx. */
export async function runCellarQuery(sparqlQuery: string): Promise<any[]> {
  const url = `${CELLAR_SPARQL_ENDPOINT}?query=${encodeURIComponent(sparqlQuery)}&format=application%2Fsparql-results%2Bjson`;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/sparql-results+json" },
        signal: AbortSignal.timeout(25000),
      });
      if (!response.ok) {
        throw new Error(`SPARQL endpoint returned status: ${response.status}`);
      }
      const data = await response.json();
      return data.results.bindings;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/** Tidy Cellar's "#"-delimited judgment titles into readable text. */
export function cleanTitle(raw: string): string {
  return raw.replace(/\s*#\s*/g, " — ").replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Stable key for a court case, so a judgment and its Official Journal notice
 * (CELEX types CJ/CA, TJ/TA, ...) collapse into one hit. Non-case CELEX ids key on themselves.
 */
function caseKey(celex: string): string {
  const m = /^6(\d{4})([CTF])[A-Z]{1,2}(\d{4})/.exec(celex);
  return m ? `${m[1]}${m[2]}${m[3]}` : celex;
}

/** Notice-type CELEX codes (OJ summaries) lose to the primary judgment/order when both exist. */
function isNotice(celex: string): boolean {
  return /^6\d{4}[CTF](A|B|C|N|V|X)\d/.test(celex);
}

/**
 * Execute a title-keyword search against the EUR-Lex SPARQL endpoint using
 * Virtuoso's full-text index (bif:contains) — orders of magnitude faster than
 * CONTAINS(LCASE(?title), ...) scans, which time out on Cellar.
 * `sectorFilter` / `courtFilter` are caller-built SPARQL FILTER clauses
 * (empty string when unused). `keywords` are sanitized here.
 */
export async function executeQuery(
  keywords: string[],
  mode: "AND" | "OR",
  top_k: number,
  sectorFilter: string,
  courtFilter: string = ""
): Promise<EurlexHit[]> {
  // bif:contains takes a quoted expression; strip anything that isn't a plain word char.
  const terms = keywords
    .map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter((k) => k.length > 0);
  if (terms.length === 0) return [];
  const expression = terms.map((t) => `'${t}'`).join(` ${mode} `);

  const sparqlQuery = `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

    SELECT DISTINCT ?work ?celex ?title ?date
    WHERE {
      ?expr cdm:expression_title ?title .
      ?title bif:contains "${expression}" .
      ?expr cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
      ?expr cdm:expression_belongs_to_work ?work .
      ?work cdm:resource_legal_id_celex ?celex .

      OPTIONAL { ?work cdm:work_date_document ?date . }
      OPTIONAL { ?work cdm:work_created_by_agent ?courtAgent . }

      ${sectorFilter}
      ${courtFilter}
    }
    ORDER BY DESC(?date)
    LIMIT ${top_k * 3}
  `;

  const bindings = await runCellarQuery(sparqlQuery);

  // Collapse judgment + OJ-notice duplicates, preferring the primary document.
  const byCase = new Map<string, any>();
  for (const b of bindings) {
    const key = caseKey(b.celex.value);
    const existing = byCase.get(key);
    if (!existing || (isNotice(existing.celex.value) && !isNotice(b.celex.value))) {
      byCase.set(key, b);
    }
  }

  return [...byCase.values()].slice(0, top_k).map((b: any) => {
    const celex = b.celex.value;
    const sector = getSectorFromCelex(celex);
    const date = b.date ? b.date.value : "N/A";
    return {
      id: celex,
      title: cleanTitle(b.title.value),
      country: "EU",
      sector,
      url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`,
      snippet: `[${sector}] EUR-Lex official record. CELEX identifier: ${celex}. Document Date: ${date}. Work Cellar URI: ${b.work.value}.`,
    };
  });
}
