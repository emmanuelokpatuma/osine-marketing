import { NextResponse } from "next/server";
import { catalogForRegions } from "@/lib/source-catalog";
import { getWorkspace } from "@/lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("regions");
  const workspace = await getWorkspace();

  const regions = fromQuery
    ? fromQuery
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    : workspace.monitorConfig.regions;

  const sources = catalogForRegions(regions);
  return NextResponse.json({ regions, sources });
}