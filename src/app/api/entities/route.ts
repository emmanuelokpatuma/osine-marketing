import { NextRequest, NextResponse } from "next/server";
import { getWorkspace, removeEntity, saveWorkspace, upsertEntity } from "@/lib/store";
import type { TrackedEntity } from "@/types/osint";
import type { SignalType } from "@/types/osint";

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
    leadGenConfig?: {
      consentRequired?: boolean;
      firstPartyOnly?: boolean;
      allowedChannels?: Array<"email" | "retargeting" | "crm" | "sms">;
      suppressionList?: string[];
      targetSectors?: string[];
      minCompanySize?: number;
      maxCompanySize?: number;
      minOpportunityValue?: number;
      preferredSignalTypes?: SignalType[];
      timeWindowDays?: number;
    };
  };

  const workspace = await getWorkspace();
  if (body.monitorConfig) {
    workspace.monitorConfig = {
      refreshSeconds: Math.max(15, body.monitorConfig.refreshSeconds ?? workspace.monitorConfig.refreshSeconds),
      minOpportunityScore: Math.max(0, Math.min(100, body.monitorConfig.minOpportunityScore ?? workspace.monitorConfig.minOpportunityScore)),
      regions: body.monitorConfig.regions?.length ? body.monitorConfig.regions : workspace.monitorConfig.regions,
    };
  }

  if (body.leadGenConfig) {
    workspace.leadGenConfig = {
      consentRequired: body.leadGenConfig.consentRequired ?? workspace.leadGenConfig.consentRequired,
      firstPartyOnly: body.leadGenConfig.firstPartyOnly ?? workspace.leadGenConfig.firstPartyOnly,
      allowedChannels: body.leadGenConfig.allowedChannels?.length
        ? body.leadGenConfig.allowedChannels
        : workspace.leadGenConfig.allowedChannels,
      suppressionList: body.leadGenConfig.suppressionList ?? workspace.leadGenConfig.suppressionList,
      targetSectors: body.leadGenConfig.targetSectors ?? workspace.leadGenConfig.targetSectors,
      minCompanySize: Math.max(1, body.leadGenConfig.minCompanySize ?? workspace.leadGenConfig.minCompanySize),
      maxCompanySize: Math.max(
        body.leadGenConfig.minCompanySize ?? workspace.leadGenConfig.minCompanySize,
        body.leadGenConfig.maxCompanySize ?? workspace.leadGenConfig.maxCompanySize,
      ),
      minOpportunityValue: Math.max(
        0,
        body.leadGenConfig.minOpportunityValue ?? workspace.leadGenConfig.minOpportunityValue,
      ),
      preferredSignalTypes: body.leadGenConfig.preferredSignalTypes?.length
        ? body.leadGenConfig.preferredSignalTypes
        : workspace.leadGenConfig.preferredSignalTypes,
      timeWindowDays: Math.max(1, body.leadGenConfig.timeWindowDays ?? workspace.leadGenConfig.timeWindowDays),
    };
  }

  if (body.monitorConfig || body.leadGenConfig) {
    await saveWorkspace(workspace);
  }

  return NextResponse.json(workspace);
}
