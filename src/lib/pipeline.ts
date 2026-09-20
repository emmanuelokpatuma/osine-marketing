import { collectSignalsForEntity, listLiveConnectors } from "@/lib/connectors";
import { allEntities, getWorkspace, savePipeline } from "@/lib/store";
import type {
  Opportunity,
  OpportunityProfile,
  PipelineResult,
  RawSignal,
  SignalType,
  SourceHealth,
  TrackedEntity,
} from "@/types/osint";

const SIGNAL_WEIGHT: Record<SignalType, number> = {
  tender: 40,
  hiring: 28,
  company_change: 16,
  news: 12,
  planning: 20,
};

function profileFromEntity(entity: TrackedEntity | null): OpportunityProfile {
  if (!entity) {
    return {
      audience: "B2B decision makers",
      geography: "United Kingdom",
      services: ["cloud migration", "platform engineering"],
      sectors: ["technology", "public sector"],
    };
  }

  return {
    audience: `${entity.name} ideal buyers`,
    geography: entity.countries.length > 0 ? entity.countries.join(",") : "Global",
    services: entity.services,
    sectors: entity.sector ? [entity.sector] : ["General"],
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
      const matchedServices = profile.services.filter((service) => {
        const lower = service.toLowerCase();
        return companySignals.some((signal) => {
          const haystack = `${signal.title} ${signal.summary} ${signal.tags.join(" ")}`.toLowerCase();
          return haystack.includes(lower);
        });
      });

      const base = companySignals.reduce((sum, signal) => {
        const weight = SIGNAL_WEIGHT[signal.signalType] ?? 10;
        return sum + weight * signal.confidence;
      }, 0);

      const serviceMatchBoost = matchedServices.length * 7;
      const multiSourceBoost = new Set(companySignals.map((item) => item.source)).size * 3;
      const score = Math.min(100, Math.round(base / Math.max(1, companySignals.length) + serviceMatchBoost + multiSourceBoost));
      const confidence = Math.min(
        1,
        companySignals.reduce((sum, signal) => sum + signal.confidence, 0) / companySignals.length,
      );

      const reasons = [
        `${companySignals.length} public signals detected in the last cycle.`,
        `${matchedServices.length} direct service matches for your offer (${profile.services.join(", ")}).`,
        `${new Set(companySignals.map((item) => item.source)).size} independent source(s) confirm momentum.`,
      ];

      const outreachFocus = matchedServices[0] ?? profile.services[0] ?? "consulting";

      return {
        companyName: first.companyName,
        location: first.location,
        sector: first.sector,
        score,
        confidence: Number(confidence.toFixed(2)),
        matchedServices,
        reasons,
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
  const profile = profileFromEntity(workspace.brand);
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