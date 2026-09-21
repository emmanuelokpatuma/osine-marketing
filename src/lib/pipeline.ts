import { collectSignalsForEntity, listLiveConnectors } from "@/lib/connectors";
import { allEntities, getWorkspace, savePipeline } from "@/lib/store";
import type {
  Opportunity,
  OpportunityProfile,
  PipelineResult,
  RawSignal,
  Workspace,
  SignalType,
  SourceHealth,
} from "@/types/osint";

const SIGNAL_WEIGHT: Record<SignalType, number> = {
  tender: 40,
  hiring: 28,
  company_change: 16,
  news: 12,
  planning: 20,
};

function profileFromWorkspace(workspace: Workspace): OpportunityProfile {
  const entity = workspace.brand;
  if (!entity) {
    return {
      audience: "B2B decision makers",
      geography: "United Kingdom",
      services: ["cloud migration", "platform engineering"],
      sectors: ["technology", "public sector"],
      minCompanySize: workspace.leadGenConfig.minCompanySize,
      maxCompanySize: workspace.leadGenConfig.maxCompanySize,
      minOpportunityValue: workspace.leadGenConfig.minOpportunityValue,
      preferredSignalTypes: workspace.leadGenConfig.preferredSignalTypes,
      timeWindowDays: workspace.leadGenConfig.timeWindowDays,
    };
  }

  return {
    audience: `${entity.name} ideal buyers`,
    geography: entity.countries.length > 0 ? entity.countries.join(",") : "Global",
    services: entity.services,
    sectors: entity.sector ? [entity.sector] : ["General"],
    minCompanySize: workspace.leadGenConfig.minCompanySize,
    maxCompanySize: workspace.leadGenConfig.maxCompanySize,
    minOpportunityValue: workspace.leadGenConfig.minOpportunityValue,
    preferredSignalTypes: workspace.leadGenConfig.preferredSignalTypes,
    timeWindowDays: workspace.leadGenConfig.timeWindowDays,
  };
}

function scoreSignals(signals: RawSignal[], profile: OpportunityProfile): Opportunity[] {
  const grouped = new Map<string, RawSignal[]>();

  for (const signal of signals) {
    const key = `${signal.companyName}::${signal.location}::${signal.sector}::${signal.signalType}`;
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(signal);
    } else {
      grouped.set(key, [signal]);
    }
  }

  return [...grouped.values()]
    .map((companySignals) => {
      const first = companySignals[0];
      const uniqueSources = new Set(companySignals.map((item) => item.source)).size;
      const latestPublishedAt = companySignals
        .map((signal) => Date.parse(signal.publishedAt))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a)[0];
      const daysSinceLatest = Number.isFinite(latestPublishedAt)
        ? Math.max(0, Math.floor((Date.now() - latestPublishedAt) / (24 * 60 * 60 * 1000)))
        : 99;
      const preferredSignalHits = companySignals.filter((signal) =>
        profile.preferredSignalTypes.includes(signal.signalType),
      ).length;
      const hiringVolumeProxy = companySignals.filter((signal) => signal.signalType === "hiring").length;
      const sizeMatchProxy =
        hiringVolumeProxy >= 4
          ? profile.minCompanySize <= 5000
          : profile.minCompanySize <= 250;
      const opportunityValueProxy =
        companySignals.some((signal) => signal.signalType === "tender")
          ? 50000
          : companySignals.some((signal) => signal.signalType === "planning")
            ? 30000
            : 12000;
      const valueMatchProxy = opportunityValueProxy >= profile.minOpportunityValue;
      const matchedServices = profile.services.filter((service) => {
        const lower = service.toLowerCase();
        return companySignals.some((signal) => {
          const haystack = `${signal.title} ${signal.summary} ${signal.tags.join(" ")}`.toLowerCase();
          return haystack.includes(lower);
        });
      });

      const sectorMatches = profile.sectors.some((sector) =>
        first.sector.toLowerCase().includes(sector.toLowerCase()),
      );
      const geographyMatches = profile.geography.toLowerCase().includes("global")
        ? true
        : first.location.toLowerCase().includes(profile.geography.toLowerCase());

      const base = companySignals.reduce((sum, signal) => {
        const weight = SIGNAL_WEIGHT[signal.signalType] ?? 10;
        return sum + weight * signal.confidence;
      }, 0);

      const serviceMatchBoost = matchedServices.length * 7;
      const multiSourceBoost = uniqueSources * 3;
      const score = Math.min(100, Math.round(base / Math.max(1, companySignals.length) + serviceMatchBoost + multiSourceBoost));
      const confidence = Math.min(
        1,
        companySignals.reduce((sum, signal) => sum + signal.confidence, 0) / companySignals.length,
      );

      const scoreBreakdown = [
        {
          label: "Industry match",
          points: sectorMatches ? 20 : 8,
          evidence: sectorMatches
            ? `Detected sector (${first.sector}) matches your target focus.`
            : `Detected sector (${first.sector}) is adjacent to your target focus.`,
        },
        {
          label: "Location match",
          points: geographyMatches ? 10 : 4,
          evidence: geographyMatches
            ? `Location (${first.location}) aligns with your active geography.`
            : `Location (${first.location}) is outside your primary geography.`,
        },
        {
          label: "Company size match (proxy)",
          points: sizeMatchProxy ? 15 : 6,
          evidence: sizeMatchProxy
            ? `Hiring/activity pattern suggests fit with ICP size range ${profile.minCompanySize}-${profile.maxCompanySize}.`
            : `Activity pattern is weaker for ICP size range ${profile.minCompanySize}-${profile.maxCompanySize}.`,
        },
        {
          label: "Opportunity value (proxy)",
          points: valueMatchProxy ? 15 : 5,
          evidence: `Estimated value proxy GBP ${opportunityValueProxy.toLocaleString()} vs ICP floor GBP ${profile.minOpportunityValue.toLocaleString()}.`,
        },
        {
          label: "Relevant activity",
          points: Math.min(30, Math.round(base / Math.max(1, companySignals.length))),
          evidence: `${companySignals.length} public signal(s) across ${uniqueSources} source(s).`,
        },
        {
          label: "Service fit",
          points: Math.min(20, matchedServices.length * 10),
          evidence:
            matchedServices.length > 0
              ? `Matched service keywords: ${matchedServices.join(", ")}.`
              : "No direct service keyword match detected yet.",
        },
        {
          label: "Preferred signal type match",
          points: Math.min(10, preferredSignalHits * 2),
          evidence:
            preferredSignalHits > 0
              ? `${preferredSignalHits} signal(s) match your preferred types (${profile.preferredSignalTypes.join(", ")}).`
              : `No preferred signal type match detected (${profile.preferredSignalTypes.join(", ")}).`,
        },
        {
          label: "Recency",
          points: daysSinceLatest <= 3 ? 10 : daysSinceLatest <= profile.timeWindowDays ? 6 : 2,
          evidence:
            daysSinceLatest <= 3
              ? "Fresh activity in the last 72 hours."
              : daysSinceLatest <= profile.timeWindowDays
                ? `Recent activity within your ${profile.timeWindowDays}-day window.`
                : `Older than your ${profile.timeWindowDays}-day activity window.`,
        },
      ];

      const signalStrength: Opportunity["signalStrength"] =
        score >= 70 ? "high" : score >= 45 ? "medium" : "emerging";

      const reasons = [
        `Signal strength ${signalStrength}.`,
        `${companySignals.length} public signals detected in the last cycle.`,
        `${matchedServices.length} direct service matches for your offer (${profile.services.join(", ")}).`,
        `${uniqueSources} independent source(s) confirm momentum.`,
      ];

      const outreachFocus = matchedServices[0] ?? profile.services[0] ?? "consulting";

      return {
        companyName: first.companyName,
        location: first.location,
        sector: first.sector,
        score,
        signalStrength,
        confidence: Number(confidence.toFixed(2)),
        matchedServices,
        reasons,
        scoreBreakdown,
        evidence: companySignals
          .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
          .slice(0, 6)
          .map((signal) => ({
            source: signal.source,
            signalType: signal.signalType,
            title: signal.title,
            url: signal.sourceUrl,
            publishedAt: signal.publishedAt,
          })),
        recommendedAction: `Prioritize outreach with a ${outreachFocus} discovery offer tied to current public signal(s).`,
        lastUpdatedAt: new Date().toISOString(),
      } satisfies Opportunity;
    })
    .sort((a, b) => b.score - a.score);
}

export async function runPipeline(): Promise<PipelineResult> {
  const workspace = await getWorkspace();
  const entities = allEntities(workspace);
  const profile = profileFromWorkspace(workspace);
  const regions = workspace.monitorConfig.regions;

  const collected = await Promise.all(
    entities.map((entity) => collectSignalsForEntity(entity, { activeRegions: regions })),
  );
  const signals = collected.flatMap((item) => item.signals);
  const sourceHealth = collected.flatMap((item) => item.health);

  const dedupByUrl = new Map<string, RawSignal>();
  for (const signal of signals) {
    dedupByUrl.set(signal.sourceUrl, signal);
  }

  const dedupedSignals = [...dedupByUrl.values()].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  const opportunities = scoreSignals(dedupedSignals, profile).filter(
    (item) => item.score >= workspace.monitorConfig.minOpportunityScore,
  );

  const expectedLiveSources = listLiveConnectors(regions);
  const expectedSourceHealth: SourceHealth[] = expectedLiveSources.map((source) => ({
    source: source.source,
    status: "error",
    message: `${source.label} selected for ${source.scope} but returned no records in this cycle.`,
    records: 0,
  }));

  const result: PipelineResult = {
    generatedAt: new Date().toISOString(),
    profile,
    signals: dedupedSignals,
    opportunities,
    sourceHealth: mergeSourceHealth([...expectedSourceHealth, ...sourceHealth]),
  };

  await savePipeline(result);
  return result;
}

function mergeSourceHealth(items: SourceHealth[]): SourceHealth[] {
  const map = new Map<string, SourceHealth>();

  for (const item of items) {
    const existing = map.get(item.source);
    if (!existing) {
      map.set(item.source, item);
      continue;
    }
    map.set(item.source, {
      source: item.source,
      status: existing.status === "ok" && item.status === "ok" ? "ok" : item.status,
      message: item.message,
      records: existing.records + item.records,
    });
  }

  return [...map.values()];
}