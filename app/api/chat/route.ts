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

async function callLegalDataHunterAPI(q: string, namespace: string = "case_law", top_k: number = 5) {
  const apiKey = process.env.LDH_API_KEY || "";
  try {
    const response = await fetch("https://legaldatahunter.com/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q, namespace, top_k })
    });

    if (!response.ok) {
      throw new Error(`LDH API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Legal Data Hunter Fetch Error:", error);
    return { error: error.message || "Failed to contact LDH database." };
  }
}

export async function POST(req: Request) {
  try {
    const { messages, defaultNamespace = "case_law", defaultTopK = 5 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing messages array." }, { status: 400 });
    }

    const searchLogs: any[] = [];

    const systemMessage = {
      role: "system",
      content: "You are a specialized Legal Data Hunter assistant focused exclusively on European law (including European Union regulations, directives, decisions, ECJ/CJEU case law, ECHR rulings, and legal frameworks of European member states). Every search query you generate must be tailored to a European legal context. Refuse to perform searches or analyze laws outside of European jurisdictions."
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

          // Execute the backend API request
          const searchResult = await callLegalDataHunterAPI(query, namespace, top_k);

          searchLogs.push({
            q: query,
            namespace,
            top_k,
            success: !searchResult.error,
            resultsCount: Array.isArray(searchResult) ? searchResult.length : 0,
            results: searchResult
          });

          // Append the tool result to the conversation
          updatedMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(searchResult)
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

    return NextResponse.json({
      content: assistantMessage.content || "No text response generated.",
      searchLogs
    });

  } catch (error: any) {
    console.error("Route Coordinator Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
