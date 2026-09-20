import type { LeadRow } from "@/lib/leadgen";
import type { Workspace } from "@/types/osint";

export type LeadInsight = {
  model: string;
  summary: string;
  industryFocus: string;
  subjectLine: string;
  openingAngle: string;
  bestChannel: string;
  contactStrategy: string;
  leadUseCases: string[];
  nextActions: string[];
  proofPoints: string[];
  complianceNotes: string[];
  suggestedCTA: string;
};

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

function fallbackInsight(workspace: Workspace, rows: LeadRow[]): LeadInsight {
  const top = rows[0];
  const sector = top?.sector ?? workspace.leadGenConfig.targetSectors[0] ?? "your target market";
  const service = workspace.brand?.services[0] ?? "your core offer";

  return {
    model: "local-fallback",
    summary: `Lead activity is strongest in ${sector}. Lead with a short, specific message tied to recent public signals and the service you already provide.`,
    industryFocus: sector,
    subjectLine: `A short idea for ${sector}`,
    openingAngle: `Reference the public signal first, then connect it to one practical outcome tied to ${service}.`,
    bestChannel: workspace.leadGenConfig.allowedChannels[0] ?? "email",
    contactStrategy: `Use a short ${workspace.leadGenConfig.allowedChannels[0] ?? "email"} intro and point to one relevant public signal.`,
    leadUseCases: [
      "Warm intro for a relevant market conversation",
      "CRM qualification and routing",
      "Follow-up after sector-specific signal detection",
    ],
    nextActions: [
      "Send one tailored message",
      "Log the lead in CRM",
      "Follow up only if allowed by your consent settings",
    ],
    proofPoints: rows.slice(0, 3).map((row) => `${row.companyName} (${row.location}) · score ${row.score}`),
    complianceNotes: [
      "Use only public, consented, or first-party data.",
      "Avoid personal data unless you have a lawful basis.",
      "Respect suppression and channel preferences.",
    ],
    suggestedCTA: "Offer a short, useful summary rather than a hard sell.",
  };
}

function extractJson(text: string): string {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

function parseInsight(text: string): LeadInsight {
  const data = JSON.parse(extractJson(text)) as Partial<LeadInsight>;
  return {
    model: data.model ?? DEFAULT_MODEL,
    summary: data.summary ?? "Use a concise, value-first opening tied to the lead’s public activity.",
    industryFocus: data.industryFocus ?? "target sector",
    subjectLine: data.subjectLine ?? "A short idea for your team",
    openingAngle: data.openingAngle ?? "Lead with the relevant public signal and one clear next step.",
    bestChannel: data.bestChannel ?? "email",
    contactStrategy: data.contactStrategy ?? "Lead with one public signal and a direct, low-pressure ask.",
    leadUseCases: Array.isArray(data.leadUseCases) ? data.leadUseCases.filter(Boolean) : [],
    nextActions: Array.isArray(data.nextActions) ? data.nextActions.filter(Boolean) : [],
    proofPoints: Array.isArray(data.proofPoints) ? data.proofPoints.filter(Boolean) : [],
    complianceNotes: Array.isArray(data.complianceNotes) ? data.complianceNotes.filter(Boolean) : [],
    suggestedCTA: data.suggestedCTA ?? "Offer a short, useful follow-up.",
  };
}

async function generateGeminiInsight(workspace: Workspace, rows: LeadRow[]): Promise<LeadInsight> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackInsight(workspace, rows);

  const model = DEFAULT_MODEL;
  const topRows = rows.slice(0, 6).map((row) => ({
    companyName: row.companyName,
    location: row.location,
    sector: row.sector,
    score: row.score,
    evidence: row.evidence,
    recommendedAction: row.recommendedAction,
  }));

  const systemInstruction = `You are helping draft compliant outreach guidance for a business intelligence platform.
Return valid JSON only with this exact shape:
{
  "model": string,
  "summary": string,
  "industryFocus": string,
  "subjectLine": string,
  "openingAngle": string,
  "bestChannel": string,
  "contactStrategy": string,
  "leadUseCases": string[],
  "nextActions": string[],
  "proofPoints": string[],
  "complianceNotes": string[],
  "suggestedCTA": string
}
Rules:
- Use only the supplied public lead data.
- Explain which industry or sector is in focus.
- Explain how to contact the lead in a compliant way.
- Explain how the lead should be used in a sales or marketing workflow.
- Do not invent personal data or hidden information.
- Keep the guidance practical, concise, and lawful.
- Avoid spammy wording or aggressive sales pressure.
- Keep the message appropriate for the selected channel.
`;

  const userPrompt = JSON.stringify(
    {
      brand: workspace.brand?.name ?? "Global Opportunity Radar",
      sectorTargets: workspace.leadGenConfig.targetSectors,
      allowedChannels: workspace.leadGenConfig.allowedChannels,
      leads: topRows,
    },
    null,
    2,
  );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 700,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    return fallbackInsight(workspace, rows);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!text) return fallbackInsight(workspace, rows);

  try {
    return parseInsight(text);
  } catch {
    return fallbackInsight(workspace, rows);
  }
}

export async function getLeadInsight(workspace: Workspace, rows: LeadRow[]): Promise<LeadInsight> {
  if (rows.length === 0) {
    return fallbackInsight(workspace, rows);
  }

  return generateGeminiInsight(workspace, rows);
}