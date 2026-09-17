"use client";

import { useEffect, useMemo, useState } from "react";
import { OpportunityCard } from "@/components/opportunity-card";
import type { ApiSourceDefinition, PipelineResult, Workspace } from "@/types/osint";

export function LiveMonitor({
  config,
  sources,
  initialResult,
}: {
  config: Workspace["monitorConfig"];
  sources: ApiSourceDefinition[];
  initialResult: PipelineResult;
}) {
  const [result, setResult] = useState<PipelineResult | null>(initialResult);
  const [refreshing, setRefreshing] = useState(false);

  async function load(refresh = false) {
    setRefreshing(true);
    const endpoint = refresh ? "/api/opportunities?refresh=1" : "/api/opportunities";
    const response = await fetch(endpoint, { cache: "no-store" });
    const data = (await response.json()) as PipelineResult;
    setResult(data);
    setRefreshing(false);
  }

  useEffect(() => {
    const handle = window.setInterval(() => {
      load(true);
    }, Math.max(15000, config.refreshSeconds * 1000));

    return () => window.clearInterval(handle);
  }, [config.refreshSeconds]);

  const liveSources = useMemo(() => sources.filter((source) => source.status === "live"), [sources]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Live Monitoring</p>
          <h2 className="mt-1 text-3xl leading-tight">Always-on Prospect Feed</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
            Auto-refreshing stream from free public APIs in your selected regions.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:brightness-110"
        >
          {refreshing ? "Refreshing..." : "Refresh now"}
        </button>
      </div>

      <section className="mt-5 rounded-2xl border border-[var(--color-rule)] bg-white/85 p-4 text-sm">
        <div className="font-medium">Regions: {config.regions.join(", ")}</div>
        <div className="mt-1 text-[var(--color-muted)]">
          Min score {config.minOpportunityScore} · Every {config.refreshSeconds}s · {liveSources.length} live source(s)
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        {liveSources.map((source) => (
          <a
            key={source.key}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-4 hover:bg-[var(--color-panel)]"
          >
            <div className="text-sm font-medium">{source.name}</div>
            <div className="mt-1 text-xs text-[var(--color-muted)]">{source.category} · {source.access}</div>
          </a>
        ))}
      </section>

      <section className="mt-8">
        <h3 className="text-xl">Live opportunities</h3>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {!result || result.opportunities.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-5 text-sm text-[var(--color-muted)]">
              No opportunities in the current cycle. Broaden regions or keywords in Signal Profiles.
            </div>
          ) : (
            result.opportunities.map((opportunity) => (
              <OpportunityCard key={`${opportunity.companyName}-${opportunity.lastUpdatedAt}`} opportunity={opportunity} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
