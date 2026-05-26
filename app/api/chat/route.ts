import { NextResponse } from "next/server";
import OpenAI from "openai";

// Prevent handler caching
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://legaldatahunter.com",
    "X-Title": "Legal Data Hunter AI",
  },
});

const searchTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "search_legal_data",
    description: "Searches the legal database for specific concepts, precedents, statutes, cases, or laws matching a query.",
    parameters: {
      type: "object",
      properties: {
        q: {
          type: "string",
          description: "The specific legal concept or query to search (e.g. 'fiduciary duty breach damages')."
        },
        namespace: {
          type: "string",
          description: "The targeted legal namespace. Defaults to 'case_law'."
        },
        top_k: {
          type: "integer",
          description: "Number of relevant documents to retrieve. Defaults to 5."
        }
      },
      required: ["q"]
    }
  }
};

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

async function callEURpxSPARQL(q: string, namespace: string = "all", top_k: number = 5) {
  const stopWords = new Set(["the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for", "with", "by", "about", "against", "eu", "europe", "european", "court", "case", "law", "precedent", "precedents", "ruling", "rulings", "judgement", "judgment", "judgments"]);
  const keywords = q.toLowerCase()
    .split(/[\s,.\-\/]+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  if (keywords.length === 0) {
    keywords.push(q.toLowerCase());
  }

  // Filter by CELEX sectors: 
  let sectorFilter = "";
  if (namespace === "case_law") {
    sectorFilter = 'FILTER(STRSTARTS(?celex, "6"))';
  } else if (namespace === "statutes") {
    sectorFilter = 'FILTER(STRSTARTS(?celex, "3"))';
  } else if (namespace === "regulatory") {
    sectorFilter = 'FILTER(STRSTARTS(?celex, "5"))';
  } else if (namespace === "international") {
    sectorFilter = 'FILTER(STRSTARTS(?celex, "1"))';
  } else if (namespace === "consolidated") {
    sectorFilter = 'FILTER(STRSTARTS(?celex, "0"))';
  } else if (namespace === "agreements") {
    sectorFilter = 'FILTER(STRSTARTS(?celex, "2"))';
  } else if (namespace === "complementary") {
    sectorFilter = 'FILTER(STRSTARTS(?celex, "4"))';
  } else if (namespace === "transposition") {
    sectorFilter = 'FILTER(STRSTARTS(?celex, "7"))';
  } else if (namespace === "national_case_law") {
    sectorFilter = 'FILTER(STRSTARTS(?celex, "8"))';
  } else if (namespace === "parliamentary") {
    sectorFilter = 'FILTER(STRSTARTS(?celex, "9"))';
  }

  // Build SPARQL filters for case-insensitive contains on all keywords
  const keywordFilters = keywords.map(kw => `CONTAINS(LCASE(?title), "${kw}")`).join(" || ");

  const sparqlQuery = `
    PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

    SELECT DISTINCT ?work ?celex ?title ?date
    WHERE {
      ?work cdm:resource_legal_id_celex ?celex .
      ?expr cdm:expression_belongs_to_work ?work .
      ?expr cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
      ?expr cdm:expression_title ?title .
      
      OPTIONAL { ?work cdm:work_date_document ?date . }
      
      ${sectorFilter}
      FILTER(${keywordFilters})
      FILTER NOT EXISTS { ?work cdm:do_not_index "true"^^<http://www.w3.org/2001/XMLSchema#boolean> }
    }
    ORDER BY DESC(?date)
    LIMIT ${top_k}
  `;

  const endpoint = 'https://publications.europa.eu/webapi/rdf/sparql';
  const url = `${endpoint}?query=${encodeURIComponent(sparqlQuery)}&format=application%2Fsparql-results%2Bjson`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/sparql-results+json' }
    });
    if (!response.ok) {
      throw new Error(`SPARQL endpoint returned status: ${response.status}`);
    }
    const data = await response.json();
    
    // Parse SPARQL bindings to search result array
    const hits = data.results.bindings.map((b: any, idx: number) => {
      const celex = b.celex.value;
      const sector = getSectorFromCelex(celex);
      return {
        id: celex,
        title: b.title.value,
        score: 0.98 - idx * 0.05,
        country: "EU",
        sector: sector,
        url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`,
        snippet: `[${sector}] EUR-Lex official record. CELEX identifier: ${celex}. Document Date: ${b.date ? b.date.value : "N/A"}. Work Cellar URI: ${b.work.value}.`
      };
    });

    return { hits };
  } catch (error: any) {
    console.error("SPARQL Query Fetch Error:", error);
    return { error: error.message || "Failed to contact EUR-Lex database." };
  }
}

export async function POST(req: Request) {
  try {
    const { messages, defaultNamespace = "all", defaultTopK = 5 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing messages array." }, { status: 400 });
    }

    const searchLogs: any[] = [];

    const systemMessage = {
      role: "system",
      content: "You are a specialized Legal Data Hunter assistant focused exclusively on European law (including European Union regulations, directives, decisions, ECJ/CJEU case law, ECHR rulings, and legal frameworks of European member states). Every search query you generate must be tailored to a European legal context. Refuse to perform searches or analyze laws outside of European jurisdictions.\n\nCRITICAL AMBIGUITY RULE:\nIf the user's request or search term is broad, generic, or ambiguous (for example, entering just 'harassment', 'dismissal', 'liability', or 'data violation' without specifying the exact context), you MUST NOT guess their intent and you MUST NOT invoke any search tools. Instead, you must ask the user clarifying questions first to understand their precise research scope (e.g. asking if they are looking for psychological harassment/mobbing, sexual harassment, or discrimination-based harassment).\n\nWhen asking clarifying questions or proposing choices/options to the user, you MUST list 3 or 4 concrete, actionable choices/options at the very end of your response, each on its own line, strictly formatted like this: [Option: Option Description]. Do not put any other text on those lines. For example:\n[Option: Workplace Psychological Harassment (Mobbing)]\n[Option: Sexual Harassment under EU Directives]\n[Option: ECHR Precedents on Stalking & Bullying]\nOnly execute a search tool once they have clarified their precise selection."
    };

    const conversationMessages = [systemMessage, ...messages];

    // Step 1: Initial call to OpenRouter specifying the search tool
    let response = await openai.chat.completions.create({
      model: "deepseek/deepseek-v4-flash",
      messages: conversationMessages,
      tools: [searchTool],
      tool_choice: "auto"
    });

    let assistantMessage = response.choices[0].message;

    // Step 2: Handle function calls if Gemini requests it
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const updatedMessages = [systemMessage, ...messages, assistantMessage];

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === "search_legal_data") {
          const args = JSON.parse(toolCall.function.arguments);
          const query = args.q;
          const namespace = args.namespace || defaultNamespace;
          const top_k = args.top_k || defaultTopK;

          // Execute the live EUR-Lex SPARQL database query
          const searchResult = await callEURpxSPARQL(query, namespace, top_k);

          const hits = (searchResult && Array.isArray(searchResult.hits)) ? searchResult.hits : [];

          searchLogs.push({
            q: query,
            namespace,
            top_k,
            success: !searchResult.error,
            resultsCount: hits.length,
            results: hits
          });

          // Append the live tool result to the conversation
          updatedMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(hits)
          });
        }
      }

      // Step 3: Call OpenRouter again with the search results
      const finalResponse = await openai.chat.completions.create({
        model: "deepseek/deepseek-v4-flash",
        messages: updatedMessages
      });

      assistantMessage = finalResponse.choices[0].message;
    }

    let finalContent = assistantMessage.content || "No text response generated.";
    // Clean up any raw thoughts or DSML tool tags that might slip into text
    finalContent = finalContent
      .replace(/<\s*\|\s*DSML[\s\S]*?>/gi, "")
      .replace(/<\s*\/\|\s*DSML[\s\S]*?>/gi, "")
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<\s*\|\s*[\s\S]*?>/gi, "")
      .trim();

    return NextResponse.json({
      content: finalContent,
      searchLogs
    });

  } catch (error: any) {
    console.error("Route Coordinator Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
