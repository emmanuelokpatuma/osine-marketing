import { NextResponse } from "next/server";
import { buildLeadRows } from "@/lib/leadgen";
import { getLeadInsight } from "@/lib/lead-insight";
import { countryLabelFromLocation, locationMatchesCountry } from "@/lib/geography";
import { runPipeline } from "@/lib/pipeline";
import { getPipeline, getWorkspace } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        prompt?: string;
        country?: string;
        sectors?: string[];
      }
    | null;

  const workspace = await getWorkspace();
  const pipeline = (await getPipeline()) ?? (await runPipeline());
  const country = body?.country?.trim() || "All countries";
  const prompt = body?.prompt?.trim() || "Show me the best opportunities and leads.";
  const sectors = body?.sectors;

  const filteredOpportunities = pipeline.opportunities.filter((item) => locationMatchesCountry(item.location, country));
  const leadRows = buildLeadRows(workspace, filteredOpportunities, { sectors });
  const insight = await getLeadInsight(workspace, leadRows, { prompt, country });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    prompt,
    country,
    availableCountries: [...new Set(pipeline.opportunities.map((item) => countryLabelFromLocation(item.location)))].sort((a, b) => a.localeCompare(b)),
    opportunityCount: filteredOpportunities.length,
    leadCount: leadRows.length,
    opportunities: filteredOpportunities,
    leads: leadRows,
    insight,
  });
}
