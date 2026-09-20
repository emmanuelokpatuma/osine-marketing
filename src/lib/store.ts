import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import type { PipelineResult, TrackedEntity, Workspace } from "@/types/osint";

const DATA_DIR = path.join(process.cwd(), "data");
const WORKSPACE_FILE = path.join(DATA_DIR, "workspace.json");
const PIPELINE_FILE = path.join(DATA_DIR, "pipeline.json");

const DEFAULT_WORKSPACE: Workspace = {
  brand: {
    id: "seed-brand",
    name: "My Cloud Consultancy",
    role: "brand",
    keywords: ["aws", "kubernetes", "platform engineering", "devops"],
    countries: ["GB"],
    services: ["cloud migration", "platform engineering", "devsecops"],
    sector: "IT Services",
  },
  competitors: [],
  monitorConfig: {
    refreshSeconds: 60,
    minOpportunityScore: 35,
    regions: ["GB"],
  },
  leadGenConfig: {
    consentRequired: true,
    firstPartyOnly: true,
    allowedChannels: ["email", "retargeting", "crm"],
    suppressionList: [],
    targetSectors: [],
  },
};

function dbEnabled(): boolean {
  if (process.env.DISABLE_DB === "1") return false;
  return Boolean(process.env.DATABASE_URL);
}

function normalizeWorkspace(input: Workspace): Workspace {
  return {
    brand: input.brand,
    competitors: input.competitors ?? [],
    monitorConfig: {
      refreshSeconds: input.monitorConfig?.refreshSeconds ?? 60,
      minOpportunityScore: input.monitorConfig?.minOpportunityScore ?? 35,
      regions: input.monitorConfig?.regions ?? ["GB"],
    },
    leadGenConfig: {
      consentRequired: input.leadGenConfig?.consentRequired ?? true,
      firstPartyOnly: input.leadGenConfig?.firstPartyOnly ?? true,
      allowedChannels: input.leadGenConfig?.allowedChannels ?? ["email", "retargeting", "crm"],
      suppressionList: input.leadGenConfig?.suppressionList ?? [],
      targetSectors: input.leadGenConfig?.targetSectors ?? [],
    },
  };
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJsonOrNull<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function parseTrackedEntityRow(row: {
  id: string;
  name: string;
  role: string;
  keywords: string;
  countries: string;
  services: string;
  sector: string | null;
}): TrackedEntity {
  return {
    id: row.id,
    name: row.name,
    role: row.role === "brand" ? "brand" : "competitor",
    keywords: JSON.parse(row.keywords) as string[],
    countries: JSON.parse(row.countries) as string[],
    services: JSON.parse(row.services) as string[],
    sector: row.sector ?? undefined,
  };
}

async function getWorkspaceFromDb(): Promise<Workspace> {
  const entities = await prisma.trackedEntity.findMany({ orderBy: { updatedAt: "desc" } });
  const monitor = await prisma.monitorConfig.findUnique({ where: { id: 1 } });
  const leadGen = await prisma.leadGenConfig.findUnique({ where: { id: 1 } });

  const brandRow = entities.find((item) => item.role === "brand") ?? null;
  const competitorRows = entities.filter((item) => item.role !== "brand");

  const workspace: Workspace = {
    brand: brandRow ? parseTrackedEntityRow(brandRow) : null,
    competitors: competitorRows.map(parseTrackedEntityRow),
    monitorConfig: {
      refreshSeconds: monitor?.refreshSeconds ?? DEFAULT_WORKSPACE.monitorConfig.refreshSeconds,
      minOpportunityScore:
        monitor?.minOpportunityScore ?? DEFAULT_WORKSPACE.monitorConfig.minOpportunityScore,
      regions: monitor?.regions ? (JSON.parse(monitor.regions) as string[]) : ["GB"],
    },
    leadGenConfig: {
      consentRequired: leadGen?.consentRequired ?? DEFAULT_WORKSPACE.leadGenConfig.consentRequired,
      firstPartyOnly: leadGen?.firstPartyOnly ?? DEFAULT_WORKSPACE.leadGenConfig.firstPartyOnly,
      allowedChannels: leadGen?.allowedChannels
        ? (JSON.parse(leadGen.allowedChannels) as Workspace["leadGenConfig"]["allowedChannels"])
        : DEFAULT_WORKSPACE.leadGenConfig.allowedChannels,
      suppressionList: leadGen?.suppressionList
        ? (JSON.parse(leadGen.suppressionList) as string[])
        : DEFAULT_WORKSPACE.leadGenConfig.suppressionList,
      targetSectors: leadGen?.targetSectors
        ? (JSON.parse(leadGen.targetSectors) as string[])
        : DEFAULT_WORKSPACE.leadGenConfig.targetSectors,
    },
  };

  return normalizeWorkspace(workspace);
}

async function saveWorkspaceToDb(workspace: Workspace): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.trackedEntity.deleteMany({});

    if (workspace.brand) {
      await tx.trackedEntity.create({
        data: {
          id: workspace.brand.id,
          name: workspace.brand.name,
          role: workspace.brand.role,
          keywords: JSON.stringify(workspace.brand.keywords),
          countries: JSON.stringify(workspace.brand.countries),
          services: JSON.stringify(workspace.brand.services),
          sector: workspace.brand.sector ?? null,
        },
      });
    }

    for (const competitor of workspace.competitors) {
      await tx.trackedEntity.create({
        data: {
          id: competitor.id,
          name: competitor.name,
          role: competitor.role,
          keywords: JSON.stringify(competitor.keywords),
          countries: JSON.stringify(competitor.countries),
          services: JSON.stringify(competitor.services),
          sector: competitor.sector ?? null,
        },
      });
    }

    await tx.monitorConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        refreshSeconds: workspace.monitorConfig.refreshSeconds,
        minOpportunityScore: workspace.monitorConfig.minOpportunityScore,
        regions: JSON.stringify(workspace.monitorConfig.regions),
      },
      update: {
        refreshSeconds: workspace.monitorConfig.refreshSeconds,
        minOpportunityScore: workspace.monitorConfig.minOpportunityScore,
        regions: JSON.stringify(workspace.monitorConfig.regions),
      },
    });

    await tx.leadGenConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        consentRequired: workspace.leadGenConfig.consentRequired,
        firstPartyOnly: workspace.leadGenConfig.firstPartyOnly,
        allowedChannels: JSON.stringify(workspace.leadGenConfig.allowedChannels),
        suppressionList: JSON.stringify(workspace.leadGenConfig.suppressionList),
        targetSectors: JSON.stringify(workspace.leadGenConfig.targetSectors),
      },
      update: {
        consentRequired: workspace.leadGenConfig.consentRequired,
        firstPartyOnly: workspace.leadGenConfig.firstPartyOnly,
        allowedChannels: JSON.stringify(workspace.leadGenConfig.allowedChannels),
        suppressionList: JSON.stringify(workspace.leadGenConfig.suppressionList),
        targetSectors: JSON.stringify(workspace.leadGenConfig.targetSectors),
      },
    });
  });
}

async function getWorkspaceFromFile(): Promise<Workspace> {
  await ensureDir();
  const workspace = await readJsonOrNull<Workspace>(WORKSPACE_FILE);
  if (workspace) {
    const normalized = normalizeWorkspace(workspace);
    if (JSON.stringify(normalized) !== JSON.stringify(workspace)) {
      await fs.writeFile(WORKSPACE_FILE, JSON.stringify(normalized, null, 2), "utf8");
    }
    return normalized;
  }

  await fs.writeFile(WORKSPACE_FILE, JSON.stringify(DEFAULT_WORKSPACE, null, 2), "utf8");
  return DEFAULT_WORKSPACE;
}

async function saveWorkspaceToFile(workspace: Workspace): Promise<void> {
  await ensureDir();
  await fs.writeFile(WORKSPACE_FILE, JSON.stringify(workspace, null, 2), "utf8");
}

export async function getWorkspace(): Promise<Workspace> {
  if (dbEnabled()) {
    try {
      const workspace = await getWorkspaceFromDb();
      if (!workspace.brand && workspace.competitors.length === 0) {
        await saveWorkspaceToDb(DEFAULT_WORKSPACE);
        return DEFAULT_WORKSPACE;
      }
      return workspace;
    } catch {
      return getWorkspaceFromFile();
    }
  }
  return getWorkspaceFromFile();
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const normalized = normalizeWorkspace(workspace);
  if (dbEnabled()) {
    try {
      await saveWorkspaceToDb(normalized);
      return;
    } catch {
      await saveWorkspaceToFile(normalized);
      return;
    }
  }
  await saveWorkspaceToFile(normalized);
}

export async function upsertEntity(entity: TrackedEntity): Promise<Workspace> {
  const workspace = await getWorkspace();
  if (entity.role === "brand") {
    workspace.brand = entity;
  } else {
    const idx = workspace.competitors.findIndex((item) => item.id === entity.id);
    if (idx >= 0) {
      workspace.competitors[idx] = entity;
    } else {
      workspace.competitors.push(entity);
    }
  }
  await saveWorkspace(workspace);
  return workspace;
}

export async function removeEntity(id: string): Promise<Workspace> {
  const workspace = await getWorkspace();
  if (workspace.brand?.id === id) {
    workspace.brand = null;
  }
  workspace.competitors = workspace.competitors.filter((item) => item.id !== id);
  await saveWorkspace(workspace);
  return workspace;
}

export function allEntities(workspace: Workspace): TrackedEntity[] {
  return workspace.brand ? [workspace.brand, ...workspace.competitors] : workspace.competitors;
}

async function getPipelineFromDb(): Promise<PipelineResult | null> {
  const row = await prisma.pipelineState.findUnique({ where: { id: 1 } });
  return row ? (JSON.parse(row.payload) as PipelineResult) : null;
}

async function savePipelineToDb(result: PipelineResult): Promise<void> {
  await prisma.pipelineState.upsert({
    where: { id: 1 },
    create: { id: 1, payload: JSON.stringify(result) },
    update: { payload: JSON.stringify(result) },
  });
}

export async function savePipeline(result: PipelineResult): Promise<void> {
  if (dbEnabled()) {
    try {
      await savePipelineToDb(result);
      return;
    } catch {
      // Fall through to file persistence.
    }
  }
  await ensureDir();
  await fs.writeFile(PIPELINE_FILE, JSON.stringify(result, null, 2), "utf8");
}

export async function getPipeline(): Promise<PipelineResult | null> {
  if (dbEnabled()) {
    try {
      const result = await getPipelineFromDb();
      if (result) return result;
    } catch {
      // Fall through to file persistence.
    }
  }
  await ensureDir();
  return readJsonOrNull<PipelineResult>(PIPELINE_FILE);
}
