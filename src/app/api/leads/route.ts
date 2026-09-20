import { NextResponse } from "next/server";
import { getPipeline, getWorkspace } from "@/lib/store";
import { buildLeadRows, leadRowsToCsv } from "@/lib/leadgen";
import { runPipeline } from "@/lib/pipeline";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const sectors = url.searchParams
    .get("sectors")
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const workspace = await getWorkspace();
  const pipeline = (await getPipeline()) ?? (await runPipeline());
  const rows = buildLeadRows(workspace, pipeline.opportunities, { sectors });

  if (format === "csv") {
    return new NextResponse(leadRowsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="global-opportunity-radar-leads.csv"',
      },
    });
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    count: rows.length,
    rows,
  });
}