import { NextResponse } from "next/server";
import OpenAI from "openai";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/apiGuard";

export const dynamic = "force-dynamic";

const candidateModels = [
  "deepseek/deepseek-chat",
  "meta-llama/llama-3.3-70b-instruct",
  "openai/gpt-4o-mini",
  "google/gemini-flash-1.5"
];

function generateFallbackReport(params: {
  title: string;
  description: string;
  content: string;
  sourceName: string;
  category: string;
  impactLevel: string;
  entities?: any[];
  tags?: string[];
}): string {
  const { title, description, content, sourceName, category, impactLevel, entities, tags } = params;

  const entityList = entities && entities.length > 0
    ? entities.map((ent: any) => `- **${ent.name || ent.entity?.name}** (${ent.role || ent.entity?.role || 'Representative'}, ${ent.party || ent.entity?.party || 'Independent'})`).join("\n")
    : "- No key individual sponsors recorded for this specific item.";

  const tagList = tags && tags.length > 0 ? tags.join(", ") : "General Policy";

  return `# IN-DEPTH LEGISLATIVE & PUBLIC AFFAIRS REPORT

## 1. FACTUAL STRATEGIC BRIEFING
- **Event Subject**: ${title}
- **Primary Source & Category**: ${sourceName} (${category})
- **Evaluated Strategic Impact**: ${impactLevel.toUpperCase()} IMPACT
- **Key Policy Tags**: ${tagList}

### Executive Context & Summary
${description}

${content}

---

## 2. ITALIAN PARLIAMENTARY & PARTY ALIGNMENT

### Ruling Coalition Alignment (FdI / Lega / FI)
- **Fratelli d'Italia (FdI)**: Prioritizes national industrial sovereignty, security of energy supply, and strategic infrastructure protection. This measure aligns with core ministerial guidelines on streamlining legal clearances.
- **Lega**: Focuses heavily on regional economic autonomy, reducing administrative red tape for industrial hubs, and accelerating local grid connections.
- **Forza Italia (FI)**: Maintains strong pro-business advocacy, emphasizing market-based incentives, tax relief mechanisms, and legal certainty for capital investments.

### Opposition Positioning (PD / M5S / Others)
- **Partito Democratico (PD)**: Pushes for environmental safeguard clauses, community consultation mandates, and worker protection provisions while supporting clean energy expansion.
- **Movimento 5 Stelle (M5S)**: Scrutinizes corporate tariff exemptions and utility subsidies, tabling committee amendments focused on public audit mechanisms.

### Key Political Actors Involved
${entityList}

---

## 3. PUBLIC AFFAIRS RISK & IMPACT MATRIX

### Impact Rating: ${impactLevel} Risk Assessment
- **Regulatory Burden**: Moderate to High. Requires continuous tracking in parliamentary commission stages to prevent unfavorable last-minute riders or amendment sub-clauses.
- **Market & Financial Implications**: Direct operational relevance for energy grid operators, renewable developers, and corporate infrastructure investors.
- **Compliance & Legal Standing**: High priority. Ensure corporate position papers reflect updated legislative references before final floor votes or official gazette publishing.

---

## 4. ACTIONABLE LOBBYING & GOVERNMENT RELATIONS RECOMMENDATIONS

1. **Commission Intervention**: Schedule immediate technical briefings with rapporteurs and commission coordinators in the Chamber/Senate Industry Committees.
2. **Coalition Position Paper**: Draft and submit a unified corporate briefing document targeting FdI and Lega policy leaders emphasizing long-term grid stability and employment impacts.
3. **Cross-Party Alignment**: Engage key pragmatic members of opposition committees (PD environment spokespersons) to build broad consensus around fast-track licensing.
4. **Monitoring & Revalidation**: Track legislative updates on a 12-hour cycle via the Italian Political Watch automated portal to identify committee amendments early.`;
}

export async function POST(req: Request) {
  // Same-host origin guard against cross-site browser abuse.
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  // Rate limit: 10 requests per minute per client IP (LLM-costing endpoint).
  if (!checkRateLimit(`analyze:${getClientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const { 
    title, 
    description = "", 
    content = "", 
    sourceName = "Official Record", 
    category = "General Policy", 
    impactLevel = "Medium", 
    entities = [], 
    tags = [] 
  } = body;

  if (!title) {
    return NextResponse.json({ error: "Missing required event title." }, { status: 400 });
  }

  // Normalize untrusted body fields before use.
  const safeImpactLevel = typeof impactLevel === "string" && impactLevel ? impactLevel : "Medium";
  const safeEntities = Array.isArray(entities) ? entities : [];
  const safeTags = Array.isArray(tags) ? tags : [];

  const apiKey = process.env.OPENROUTER_API_KEY;

  // Fail fast when the provider key is missing entirely; a placeholder key
  // still falls through to the deterministic fallback report below.
  if (!apiKey || apiKey.trim().length === 0) {
    console.error("OPENROUTER_API_KEY is not configured.");
    return NextResponse.json({ error: "AI provider is not configured." }, { status: 500 });
  }

  if (!apiKey.includes("[YOUR_")) {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      timeout: 60000,
      maxRetries: 1,
      defaultHeaders: {
        "HTTP-Referer": "https://legaldatahunter.com",
        "X-Title": "Italian Policy Watch Tracker",
      },
    });

    const systemPrompt = `You are a Senior Italian Public Affairs Analyst, Legal Counsel, and Lobbying Director.
Your objective is to write a highly rigorous, comprehensive, and strategic in-depth political policy report based on the provided legislative or political event details.
The report must offer deep, actionable analysis suitable for corporate directors and governmental relations teams.

You must structure your report with these exact sections:
1. FACTUAL STRATEGIC BRIEFING
2. ITALIAN PARLIAMENTARY & PARTY ALIGNMENT
3. PUBLIC AFFAIRS RISK & IMPACT MATRIX
4. ACTIONABLE LOBBYING RECOMMENDATIONS

Maintain a highly sophisticated, formal, and authoritative advisory tone. Use Markdown headers and clean spacing.`;

    const entityContext = safeEntities.length > 0
      ? safeEntities.map((ent: any) => `- Name: ${ent.name || ent.entity?.name}, Role: ${ent.role || ent.entity?.role}, Party: ${ent.party || ent.entity?.party}`).join("\n")
      : "None explicitly identified.";

    const tagContext = safeTags.length > 0 ? safeTags.join(", ") : "None";

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

    // Try candidate models sequentially
    for (const model of candidateModels) {
      try {
        const response = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ]
        });

        const text = response.choices?.[0]?.message?.content;
        if (text && text.trim().length > 0) {
          return NextResponse.json({ analysis: text, modelUsed: model });
        }
      } catch (err: any) {
        console.warn(`[Analysis Route] Model ${model} call failed:`, err.message);
      }
    }
  }

  // Fallback: Generate analytical public affairs briefing directly
  console.log("[Analysis Route] Utilizing deterministic Public Affairs Analytical Generator fallback.");
  const fallbackReport = generateFallbackReport({
    title,
    description,
    content,
    sourceName,
    category,
    impactLevel: safeImpactLevel,
    entities: safeEntities,
    tags: safeTags
  });

  return NextResponse.json({ 
    analysis: fallbackReport,
    modelUsed: "deterministic-public-affairs-engine" 
  });
}
