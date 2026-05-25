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
    const { title, snippet, namespace } = await req.json();

    if (!title || !snippet) {
      return NextResponse.json({ error: "Missing title or snippet." }, { status: 400 });
    }

    const systemPrompt = `You are a Senior European Union Lawyer and expert legal analyst.
Your objective is to write a highly comprehensive, professional, and rigorous legal case summary of approximately 1000 words based on the legal document provided.
The summary must focus strictly on the case, its background, and implications under European Union law.

You must structure your summary with these sections:
1. CASE CITATION & IDENTIFICATION
   - Document Title
   - Database Namespace (e.g. case_law, statutes, regulatory)
   - Source context.
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
Namespace: ${namespace || "case_law"}
Content/Snippet: ${snippet}`;

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
