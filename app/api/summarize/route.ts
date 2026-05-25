import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://legaldatahunter.com",
    "X-Title": "Legal Data Hunter AI",
  },
});

export async function POST(req: Request) {
  try {
    const { title, snippet, namespace, celex } = await req.json();

    if (!celex) {
      return NextResponse.json({ error: "Missing CELEX identifier." }, { status: 400 });
    }

    // Fetch the actual official document from the EUR-Lex Cellar RESTful web service
    let officialText = snippet || "";
    try {
      const cellarUrl = `https://publications.europa.eu/resource/celex/${celex}?language=ENG&format=HTML`;
      const res = await fetch(cellarUrl);
      if (res.ok) {
        const htmlContent = await res.text();
        // Strip HTML tags and normalize spacing
        const stripped = htmlContent
          .replace(/<[^>]*?>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        
        if (stripped.length > 500) {
          officialText = stripped.substring(0, 16000); // Extract first 16,000 characters
        }
      }
    } catch (fetchErr) {
      console.warn("Failed to fetch official full text from Cellar, falling back to snippet:", fetchErr);
    }

    const systemPrompt = `You are a Senior European Union Lawyer and expert legal analyst.
Your objective is to write a highly comprehensive, professional, and rigorous legal case summary of approximately 1000 words based on the actual official text of the European Union document provided.
The summary must focus strictly on the case, its background, and implications under European Union law.

You must structure your summary with these sections:
1. CASE CITATION & IDENTIFICATION
   - Document Title
   - Database Namespace (e.g. case_law, statutes, regulatory)
   - CELEX Identifier (e.g. 62021CJ0300)
   - Official Resource URI
2. CORE FACTS OF THE DISPUTE
   - Complete factual background and timelines of the dispute.
   - The primary parties involved and their legal contentions.
3. KEY LEGAL ISSUES & DIRECTIVES
   - Core legal questions raised under European Union law.
   - Specific EU Directives, Regulations, or Treaty Articles involved (e.g. GDPR, Pay Equity, Environmental Liability).
4. COURT'S RATIONALE & HOLDING
   - The detailed legal reasoning of the court.
   - Critical legal precedents analyzed.
   - The final binding holding and orders.
5. STRATEGIC IMPLICATIONS FOR EU LAW
   - Broad impact on European Union jurisprudence.
   - Practical consequences for member states, corporations, or individuals.

Maintain a formal, authoritative, and sophisticated legal tone. Present the summary with clear spacing and paragraph divisions.`;

    const userMessage = `Please draft the comprehensive case summary for the following European document:

Title: ${title}
CELEX: ${celex}
Namespace: ${namespace || "case_law"}
Official Text Context:
${officialText}`;

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-v4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    const summaryText = response.choices[0].message.content || "Failed to generate legal summary.";

    return NextResponse.json({ summary: summaryText });

  } catch (error: any) {
    console.error("Summarize Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
