import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://legaldatahunter.com",
    "X-Title": "Italian Policy Watch Tracker",
  },
});

export async function POST(req: Request) {
  try {
    const { 
      title, 
      description, 
      content, 
      sourceName, 
      category, 
      impactLevel, 
      entities, 
      tags 
    } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Missing required event fields (title, content)." }, { status: 400 });
    }

    const systemPrompt = `You are a Senior Italian Public Affairs Analyst, Legal Counsel, and Lobbying Director.
Your objective is to write a highly rigorous, comprehensive, and strategic in-depth political policy report based on the provided legislative or political event details.
The report must offer deep, actionable analysis suitable for corporate directors and governmental relations teams.

You must structure your report with these exact sections:
1. FACTUAL STRATEGIC BRIEFING
   - Provide a granular summary of the event.
   - Map the key policy domains, timelines, and legal instruments involved (e.g., decrees, parliamentary votes, RDF sources).
   - Evaluate the significance of the source (${sourceName}) and the category (${category}).

2. ITALIAN PARLIAMENTARY & PARTY ALIGNMENT
   - Deeply analyze the impact of this event on the ruling coalition (Fratelli d'Italia, Lega, Forza Italia) and key opposition factions (Partito Democratico, Movimento 5 Stelle).
   - Identify critical politician actors and their strategic motivations, citing any entities listed in the event context.
   - Predict legislative durability and potential hurdles in parliamentary commissions.

3. PUBLIC AFFAIRS RISK & IMPACT MATRIX
   - Conduct a systematic risk assessment corresponding to the ${impactLevel} Impact level.
   - Highlight specific regulatory risks, market entry threats, or compliance liabilities for major corporate operations (e.g., energy, infrastructure, regional grid connections, state-aid exemptions).
   - Address strategic vulnerabilities or green transition opportunities.

4. ACTIONABLE LOBBYING RECOMMENDATIONS
   - Provide concrete, tactical, bulleted action items for the governmental relations team.
   - Focus on position paper revisions, key committee interventions, coalition lobbying alignments, and engagement strategies with relevant DG COMP or ministerial directorates.

Maintain a highly sophisticated, formal, and authoritative advisory tone. Use Markdown headers and clean spacing for excellent readability.`;

    const entityContext = entities && entities.length > 0
      ? entities.map((ent: any) => `- Name: ${ent.name || ent.entity?.name}, Role: ${ent.role || ent.entity?.role}, Party: ${ent.party || ent.entity?.party}`).join("\n")
      : "None explicitly identified.";

    const tagContext = tags && tags.length > 0 ? tags.join(", ") : "None";

    const userMessage = `Please draft the in-depth political policy report for the following event:

Title: ${title}
Source: ${sourceName} (Category: ${category})
Impact Level: ${impactLevel}
Description: ${description}
Tags: ${tagContext}

Event Content Context:
${content}

Associated Political Actors / Entities:
${entityContext}`;

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-v4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    const analysisText = response.choices[0].message.content || "Failed to generate public affairs analysis.";

    return NextResponse.json({ analysis: analysisText });

  } catch (error: any) {
    console.error("Politics Tracker Analysis Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error during analysis generation." }, { status: 500 });
  }
}
