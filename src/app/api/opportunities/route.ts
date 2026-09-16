import { NextResponse } from "next/server";
import { getPipeline } from "@/lib/store";
import { runPipeline } from "@/lib/pipeline";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";

  if (refresh) {
    const result = await runPipeline();
    return NextResponse.json(result);
  }

  const current = await getPipeline();
  if (current) {
    return NextResponse.json(current);
  }

  const firstRun = await runPipeline();
  return NextResponse.json(firstRun);
}
