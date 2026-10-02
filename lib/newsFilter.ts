/**
 * Relevance filter for NewsData.io articles.
 *
 * NewsData's `category=politics` is loose: it returns non-Italian articles, items tagged with
 * dozens of countries, and sport/entertainment stories. An article is kept only if it is
 * (1) in Italian, (2) tagged to Italy alone (or at most a couple of countries), and
 * (3) mentions Italian-politics or EU-policy terms in its title/description.
 * (3) is a keyword heuristic, so it favours precision over recall.
 */

const POLITICS_TERMS = [
  "governo", "parlament", "camera dei deputati", "senato", "senator", "deputat", "ministr", "premier",
  "palazzo chigi", "quirinale", "mattarella", "meloni", "salvini", "tajani", "schlein", "conte", "renzi",
  "fratelli d'italia", "fdi", "lega", "forza italia", "partito democratico", "pd ", "m5s", "movimento 5 stelle",
  "campo largo", "maggioranza", "opposizione", "coalizione", "legge", "decreto", "ddl", "manovra", "cdm",
  "consiglio dei ministri", "riforma", "elettorale", "referendum", "elezion", "regionali", "fisco", "tasse",
  "bruxelles", "commissione europea", "parlamento europeo", "von der leyen", "ue ", " ue", "unione europea",
  "pnrr", "energia", "rinnovabil", "bollette", "transizione", "aiuti di stato", "antitrust", "authority", "arera",
];

export interface NewsDataArticle {
  title?: string;
  description?: string;
  language?: string;
  country?: string[] | string;
}

export function isRelevantItalianPolitics(article: NewsDataArticle): boolean {
  if ((article.language ?? "").toLowerCase() !== "italian") return false;

  const countries = Array.isArray(article.country) ? article.country : article.country ? [article.country] : [];
  if (countries.length > 3 || (countries.length > 0 && !countries.includes("italy"))) return false;

  const text = ` ${article.title ?? ""} ${article.description ?? ""} `.toLowerCase();
  return POLITICS_TERMS.some((term) => text.includes(term));
}
