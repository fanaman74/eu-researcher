import { NextResponse } from "next/server";
import { AiProviderError, createAiClientForRequest, type AiMessage, type AiTool } from "@/lib/llm";
import { AiConfigError } from "@/lib/aiSettings";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/apiGuard";
import { sanitizeForSparql, STOP_WORDS, clampTopK, executeQuery, type EurlexHit } from "@/lib/eurlex";

// Prevent handler caching
export const dynamic = "force-dynamic";

const searchTool: AiTool = {
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

async function callEurLexSPARQL(q: string, namespace: string = "all", top_k: number = 5): Promise<{ hits?: EurlexHit[]; error?: string }> {
  const stopWords = new Set([...STOP_WORDS, "eu", "europe", "european", "court", "case", "law", "precedent", "precedents", "ruling", "rulings", "judgement", "judgment", "judgments"]);
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

  // Harassment queries should specifically target General Court or Civil Service Tribunal cases
  let harassmentCourtFilter = "";
  if (keywords.includes("harassment") || q.toLowerCase().includes("harassment")) {
    harassmentCourtFilter = `
      FILTER(
        ?courtAgent = <http://publications.europa.eu/resource/authority/corporate-body/GCEU> || 
        ?courtAgent = <http://publications.europa.eu/resource/authority/corporate-body/CST> ||
        CONTAINS(STR(?celex), "T") || 
        CONTAINS(STR(?celex), "F")
      )
    `;
  }

  try {
    // 1. Try high-precision AND search first
    const safeKeywords = keywords.flatMap(kw => sanitizeForSparql(kw).split(/[^a-zA-Z0-9]+/)).filter(Boolean);
    let hits = await executeQuery(safeKeywords, "AND", top_k, sectorFilter, harassmentCourtFilter);

    // 2. If no hits, fallback to OR search
    if (hits.length === 0 && safeKeywords.length > 1) {
      hits = await executeQuery(safeKeywords, "OR", top_k, sectorFilter, harassmentCourtFilter);
    }
    
    return { hits };
  } catch (error: any) {
    console.error("SPARQL Query Fetch Error:", error);
    return { error: "Failed to contact EUR-Lex database." };
  }
}

export async function POST(req: Request) {
  // Same-host origin guard against cross-site browser abuse.
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  // Rate limit: 20 requests per minute per client IP (LLM-costing endpoint).
  if (!checkRateLimit(`chat:${getClientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  try {
    const client = await createAiClientForRequest();
    const { messages, defaultNamespace = "all", defaultTopK = 5 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing messages array." }, { status: 400 });
    }
    // Cap request size to bound token cost per call.
    if (messages.length > 20 || JSON.stringify(messages).length > 16000) {
      return NextResponse.json({ error: "Request payload too large." }, { status: 400 });
    }
    if (!messages.every((message: unknown) => {
      if (!message || typeof message !== "object") return false;
      const value = message as Record<string, unknown>;
      return (value.role === "user" || value.role === "assistant") && typeof value.content === "string" && value.content.length <= 12000;
    })) return NextResponse.json({ error: "Messages must contain only user and assistant text." }, { status: 400 });
    const safeMessages: AiMessage[] = messages.map((message: { role: "user" | "assistant"; content: string }) => ({ role: message.role, content: message.content }));

    const searchLogs: any[] = [];

    const systemMessage: AiMessage = {
      role: "system",
      content: "You are a specialized Legal Data Hunter assistant focused exclusively on European law (including European Union regulations, directives, decisions, ECJ/CJEU case law, ECHR rulings, and legal frameworks of European member states). Every search query you generate must be tailored to a European legal context. Refuse to perform searches or analyze laws outside of European jurisdictions.\n\nCRITICAL SPECIFICITY RULE:\nIf the user's request or search term is already relatively specific (for example, if they enter 'psychological harassment', 'dismissal due to pregnancy', 'GDPR biometric data', or explicitly request 'recent cases' or 'precedents'), this is NOT ambiguous. In all such cases, you MUST IMMEDIATELY invoke the 'search_legal_data' tool to query the live database and present the results first. Do not ask clarifying questions first if they have provided a multi-word specific term.\n\nCRITICAL AMBIGUITY RULE:\nONLY if the user's input is a single broad/generic word (e.g. just entering 'harassment', 'dismissal', 'liability', or 'data violation' with absolutely no context or descriptors), you must ask clarifying questions to narrow down their research. In this scenario, you MUST list 3 or 4 concrete, actionable choices/options at the very end of your response, each on its own line, strictly formatted like this: [Option: Option Description]. One of these options MUST always be a concrete option for recent court cases (e.g., '[Option: Recent CJEU Cases on Psychological Harassment]'). For example:\n[Option: Recent CJEU Cases on Psychological Harassment]\n[Option: Workplace Psychological Harassment (Mobbing) Directives]\n[Option: Sexual Harassment under EU Equality Law]\nOnly execute a search tool once they have clarified their selection for these single-word broad terms."
    };

    const conversationMessages: AiMessage[] = [systemMessage, ...safeMessages];

    // Step 1: Initial call to OpenRouter specifying the search tool
    const response = await client.complete(conversationMessages as AiMessage[], {
      tools: [searchTool],
      tool_choice: "auto"
    });

    let assistantMessage = response;

    // Step 2: Handle function calls if the LLM requests it
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const assistantPlainMessage: AiMessage = {
        role: "assistant" as const,
        content: assistantMessage.content || "",
        tool_calls: assistantMessage.tool_calls,
        nativeContent: assistantMessage.nativeContent,
        reasoning_content: assistantMessage.reasoning_content,
        reasoning_details: assistantMessage.reasoning_details,
      };
      const updatedMessages: AiMessage[] = [systemMessage, ...safeMessages, assistantPlainMessage];

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === "search_legal_data") {
          let args: any = null;
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            // Continue with a safe tool-result message so the model can recover.
          }
          if (!args || typeof args.q !== "string" || !args.q.trim()) {
            // Skip the search but still answer the tool call so the conversation stays valid.
            updatedMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: "Malformed search arguments." })
            });
            continue;
          }
          const query = args.q;
          const namespace = args.namespace || defaultNamespace;
          const top_k = clampTopK(args.top_k || defaultTopK);

          // Execute the live EUR-Lex SPARQL database query
          const searchResult = await callEurLexSPARQL(query, namespace, top_k);

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
      const finalResponse = await client.complete(updatedMessages);

      assistantMessage = finalResponse;
      if (!assistantMessage) {
        return NextResponse.json({ error: "AI provider returned an invalid response." }, { status: 502 });
      }
    }

    if (!assistantMessage.content || !assistantMessage.content.trim()) return NextResponse.json({ error: "AI provider returned no text response.", category: "invalid-response" }, { status: 502 });
    let finalContent = assistantMessage.content;
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

  } catch (error: unknown) {
    if (error instanceof AiConfigError) return NextResponse.json({ error: error.message, category: error.code }, { status: error.code === "missing" ? 503 : 400 });
    if (error instanceof AiProviderError) return NextResponse.json({ error: "The selected AI provider could not complete the request.", category: error.category }, { status: 502 });
    return NextResponse.json({ error: "Failed to process chat request.", category: "provider" }, { status: 502 });
  }
}

