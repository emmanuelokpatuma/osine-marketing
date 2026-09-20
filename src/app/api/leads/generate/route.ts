import { NextResponse } from "next/server";
import { buildLeadRows } from "@/lib/leadgen";
import { getLeadInsight } from "@/lib/lead-insight";
import { countryLabelFromLocation, locationMatchesCountry } from "@/lib/geography";
import { runPipeline } from "@/lib/pipeline";
import { getPipeline, getWorkspace } from "@/lib/store";

const PRIORITY_SECTORS = [
  "retail",
  "grocery",
  "energy",
  "utility",
  "real estate",
  "property",
  "technology",
  "software",
  "health",
  "financial",
  "bank",
  "fintech",
  "manufacturing",
  "logistics",
];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        prompt?: string;
        country?: string;
        sectors?: string[];
        mode?: "priority" | "all";
      }
    | null;

  const workspace = await getWorkspace();
  const pipeline = (await getPipeline()) ?? (await runPipeline());
  const country = body?.country?.trim() || "All countries";
  const prompt = body?.prompt?.trim() || "Show me the best opportunities and leads.";
  const sectors = body?.sectors;
  const mode = body?.mode === "priority" ? "priority" : "all";

  const filteredOpportunities = pipeline.opportunities.filter((item) => locationMatchesCountry(item.location, country));
  const prioritizedOpportunities = filteredOpportunities
    .map((item) => {
      const sector = item.sector.toLowerCase();
      const boost = PRIORITY_SECTORS.some((keyword) => sector.includes(keyword)) ? 8 : 0;
      return mode === "priority" ? { ...item, score: Math.min(100, item.score + boost) } : item;
    })
    .sort((a, b) => b.score - a.score);

  const leadRows = buildLeadRows(workspace, prioritizedOpportunities, { sectors });
  const insight = await getLeadInsight(workspace, leadRows, { prompt, country });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    prompt,
    country,
    mode,
    availableCountries: [...new Set(pipeline.opportunities.map((item) => countryLabelFromLocation(item.location)))].sort((a, b) => a.localeCompare(b)),
    opportunityCount: prioritizedOpportunities.length,
    leadCount: leadRows.length,
    opportunities: prioritizedOpportunities,
    leads: leadRows,
    insight,
  });
}
