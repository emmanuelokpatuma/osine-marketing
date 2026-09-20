import type { Opportunity, Workspace } from "@/types/osint";

export type LeadRow = {
  companyName: string;
  location: string;
  sector: string;
  score: number;
  confidence: number;
  channel: string;
  compliance: "approved" | "review" | "blocked";
  evidence: string;
  recommendedAction: string;
  outreachTemplate: string;
};

export type LeadRowFilter = {
  sectors?: string[];
};

function suppressionHit(workspace: Workspace, companyName: string): boolean {
  const needle = companyName.toLowerCase();
  return workspace.leadGenConfig.suppressionList.some((item) => needle.includes(item.toLowerCase()));
}

export function complianceStatus(workspace: Workspace, companyName: string): LeadRow["compliance"] {
  if (!workspace.leadGenConfig.consentRequired) return "review";
  if (suppressionHit(workspace, companyName)) return "blocked";
  if (workspace.leadGenConfig.firstPartyOnly && workspace.brand === null) return "review";
  return "approved";
}

function pickChannel(workspace: Workspace): string {
  return workspace.leadGenConfig.allowedChannels[0] ?? "email";
}

function templateForLead(workspace: Workspace, lead: Opportunity): string {
  const service = lead.matchedServices[0] ?? workspace.brand?.services[0] ?? "support";
  return [
    `Hi ${lead.companyName},`,
    `We noticed recent public signals suggesting activity in ${lead.location} around ${lead.sector}.`,
    `We help teams with ${service} and would be glad to share one practical idea tailored to your current direction.`,
    `If useful, I can send a short summary and a compliant next-step checklist.`,
    `Best regards,`,
    workspace.brand?.name ?? "Global Opportunity Radar",
  ].join("\n");
}

export function buildLeadRows(
  workspace: Workspace,
  opportunities: Opportunity[],
  filter: LeadRowFilter = {},
): LeadRow[] {
  const sectorTargets = (filter.sectors ?? workspace.leadGenConfig.targetSectors).map((item) => item.toLowerCase());

  return opportunities
    .filter((item) => item.score >= workspace.monitorConfig.minOpportunityScore)
    .filter((item) => {
      if (sectorTargets.length === 0) return true;
      return sectorTargets.some((sector) => item.sector.toLowerCase().includes(sector));
    })
    .map((item) => ({
      companyName: item.companyName,
      location: item.location,
      sector: item.sector,
      score: item.score,
      confidence: item.confidence,
      channel: pickChannel(workspace),
      compliance: complianceStatus(workspace, item.companyName),
      evidence: item.reasons[0] ?? item.recommendedAction,
      recommendedAction: item.recommendedAction,
      outreachTemplate: templateForLead(workspace, item),
    }))
    .filter((row) => row.compliance !== "blocked")
    .sort((a, b) => b.score - a.score);
}

export function leadRowsToCsv(rows: LeadRow[]): string {
  const header = [
    "companyName",
    "location",
    "sector",
    "score",
    "confidence",
    "channel",
    "compliance",
    "evidence",
    "recommendedAction",
    "outreachTemplate",
  ];

  const escape = (value: string | number) => {
    const text = String(value).replace(/"/g, '""');
    return `"${text}"`;
  };

  return [
    header.map(escape).join(","),
    ...rows.map((row) =>
      [
        row.companyName,
        row.location,
        row.sector,
        row.score,
        row.confidence,
        row.channel,
        row.compliance,
        row.evidence,
        row.recommendedAction,
        row.outreachTemplate,
      ]
        .map(escape)
        .join(","),
    ),
  ].join("\n");
}