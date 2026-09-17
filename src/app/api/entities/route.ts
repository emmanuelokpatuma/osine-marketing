import { NextRequest, NextResponse } from "next/server";
import { getWorkspace, removeEntity, saveWorkspace, upsertEntity } from "@/lib/store";
import type { TrackedEntity } from "@/types/osint";

export async function GET() {
  const workspace = await getWorkspace();
  return NextResponse.json(workspace);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<TrackedEntity>;
  if (!body.name || !body.role) {
    return NextResponse.json({ error: "name and role are required" }, { status: 400 });
  }

  const entity: TrackedEntity = {
    id: body.id ?? crypto.randomUUID(),
    name: body.name.trim(),
    role: body.role,
    keywords: body.keywords ?? [],
    countries: (body.countries ?? ["GB"]).map((item) => item.toUpperCase()),
    services: body.services ?? [],
    sector: body.sector,
  };

  const workspace = await upsertEntity(entity);
  return NextResponse.json(workspace);
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const workspace = await removeEntity(body.id);
  return NextResponse.json(workspace);
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as {
    monitorConfig?: {
      refreshSeconds?: number;
      minOpportunityScore?: number;
      regions?: string[];
    };
  };

  const workspace = await getWorkspace();
  if (body.monitorConfig) {
    workspace.monitorConfig = {
      refreshSeconds: Math.max(15, body.monitorConfig.refreshSeconds ?? workspace.monitorConfig.refreshSeconds),
      minOpportunityScore: Math.max(0, Math.min(100, body.monitorConfig.minOpportunityScore ?? workspace.monitorConfig.minOpportunityScore)),
      regions: body.monitorConfig.regions?.length ? body.monitorConfig.regions : workspace.monitorConfig.regions,
    };
    await saveWorkspace(workspace);
  }

  return NextResponse.json(workspace);
}
