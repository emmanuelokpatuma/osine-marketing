import { promises as fs } from "node:fs";
import path from "node:path";
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
};

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

export async function getWorkspace(): Promise<Workspace> {
  await ensureDir();
  const workspace = await readJsonOrNull<Workspace>(WORKSPACE_FILE);
  if (workspace) return workspace;
  await fs.writeFile(WORKSPACE_FILE, JSON.stringify(DEFAULT_WORKSPACE, null, 2), "utf8");
  return DEFAULT_WORKSPACE;
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  await ensureDir();
  await fs.writeFile(WORKSPACE_FILE, JSON.stringify(workspace, null, 2), "utf8");
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

export async function savePipeline(result: PipelineResult): Promise<void> {
  await ensureDir();
  await fs.writeFile(PIPELINE_FILE, JSON.stringify(result, null, 2), "utf8");
}

export async function getPipeline(): Promise<PipelineResult | null> {
  await ensureDir();
  return readJsonOrNull<PipelineResult>(PIPELINE_FILE);
}