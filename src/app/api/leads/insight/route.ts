import { NextResponse } from "next/server";
import { buildLeadRows } from "@/lib/leadgen";
import { getLeadInsight } from "@/lib/lead-insight";
import { runPipeline } from "@/lib/pipeline";
import { getPipeline, getWorkspace } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sectors = url.searchParams
    .get("sectors")
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const workspace = await getWorkspace();
  const pipeline = (await getPipeline()) ?? (await runPipeline());
  const rows = buildLeadRows(workspace, pipeline.opportunities, { sectors });
  const insight = await getLeadInsight(workspace, rows);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    count: rows.length,
    insight,
  });
}