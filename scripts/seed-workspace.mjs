import fs from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const workspacePath = path.join(dataDir, "workspace.json");

const defaultWorkspace = {
  brand: {
    id: "seed-brand",
    name: "My Cloud Consultancy",
    role: "brand",
    keywords: ["aws", "kubernetes", "platform engineering", "devops"],
    countries: ["GB"],
    services: ["cloud migration", "platform engineering", "devsecops"],
    sector: "IT Services"
  },
  competitors: [],
  monitorConfig: {
    refreshSeconds: 60,
    minOpportunityScore: 45,
    regions: ["GB"]
  }
};

await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(workspacePath, JSON.stringify(defaultWorkspace, null, 2), "utf8");
console.log(`Seeded fallback workspace at ${workspacePath}`);
