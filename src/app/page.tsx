import { catalogForRegions } from "@/lib/source-catalog";
import { runPipeline } from "@/lib/pipeline";
import { getPipeline, getWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const workspace = await getWorkspace();
  const sources = catalogForRegions(workspace.monitorConfig.regions);
  const liveCount = sources.filter((source) => source.status === "live").length;
  const result = (await getPipeline()) ?? (await runPipeline());
  const topScore = result.opportunities[0]?.score ?? 0;
  const signalTypeCounts = result.signals.reduce<Record<string, number>>((acc, signal) => {
    acc[signal.signalType] = (acc[signal.signalType] ?? 0) + 1;
    return acc;
  }, {});
  const sourceStatusCounts = result.sourceHealth.reduce<Record<string, number>>((acc, source) => {
    acc[source.status] = (acc[source.status] ?? 0) + 1;
    return acc;
  }, {});
  const topOpportunity = result.opportunities[0];
  const topSignals = result.signals.slice(0, 4);

  return (
    <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="data-mono lg:sticky lg:top-10 lg:h-fit">
        <div className="kicker">Market snapshot</div>
        <div className="mt-4 space-y-2 text-[var(--muted)]">
          <div>scan focus: {workspace.monitorConfig.regions.join(", ")}</div>
          <div>signals scanned: {result.signals.length}</div>
          <div>lead matches: {result.opportunities.length}</div>
          <div>active sources: {liveCount}/{sources.length}</div>
          <div>refresh cycle: every {workspace.monitorConfig.refreshSeconds}s</div>
          <div>updated: {new Date(result.generatedAt).toISOString()}</div>
        </div>

        <div className="mt-10 border-t border-[var(--rule)] pt-5 text-[var(--signal)]">
          live market scan: active
        </div>
      </aside>

      <div>
        <section className="relative overflow-hidden pb-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="relative overflow-hidden">
              <div className="hero-map" aria-hidden>
                <svg viewBox="0 0 1200 380" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M44 202C112 160 189 148 262 167C318 181 362 175 415 149C473 120 540 115 604 131C651 143 698 169 742 171C804 173 856 136 914 133C972 130 1038 160 1156 205" stroke="var(--brass)" strokeOpacity="0.45" />
                  <path d="M66 238C130 208 189 205 253 221C312 236 371 224 425 198C489 168 548 167 611 182C669 196 726 225 782 227C842 230 901 199 961 193C1031 186 1095 214 1168 240" stroke="var(--brass)" strokeOpacity="0.35" />
                  <path d="M232 115L309 150L401 148L523 102L627 103L754 130L858 121L969 142" stroke="var(--signal)" strokeOpacity="0.45" strokeDasharray="4 5" />
                </svg>
                <div className="hero-sweep" />
              </div>

              <p className="kicker">Public-source intelligence for finding buyers</p>
              <h1 className="mt-4 max-w-[18ch] text-[46px] leading-[1.05] tracking-[-0.02em] text-[var(--paper)] md:text-[72px]">
                Turn public data into leads you can act on.
              </h1>
              <p className="mt-7 max-w-[68ch] text-base leading-[1.6] text-[var(--muted)]">
                Global Opportunity Radar watches public sources for signs that a business may be ready to buy, expand, hire, or respond to market change. It turns those signals into ranked leads, clear next steps, and compliant outreach guidance.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/live" className="instrument-button instrument-button-primary">
                  Open live monitor
                </a>
                <a href="/settings" className="instrument-button instrument-button-quiet">
                  Configure regions
                </a>
                <a href="/leads" className="instrument-button instrument-button-quiet">
                  Open leads export
                </a>
              </div>
            </div>

            <div className="border border-[var(--rule)] bg-[rgba(237,234,224,0.03)] p-5">
              <div className="kicker mb-3">All-seeing eye</div>
              <div className="relative overflow-hidden border border-[var(--rule)] bg-[rgba(237,234,224,0.02)] p-4">
                <svg viewBox="0 0 420 220" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <circle cx="210" cy="110" r="84" stroke="var(--brass)" strokeOpacity="0.45" />
                  <circle cx="210" cy="110" r="60" stroke="var(--signal)" strokeOpacity="0.45" />
                  <circle cx="210" cy="110" r="32" stroke="var(--brass)" strokeOpacity="0.28" />
                  <path d="M58 110H362" stroke="var(--rule)" strokeOpacity="0.6" />
                  <path d="M210 26V194" stroke="var(--rule)" strokeOpacity="0.6" />
                  <path d="M122 64L300 156" stroke="var(--signal)" strokeOpacity="0.5" strokeDasharray="6 7" />
                  <circle cx="300" cy="156" r="5" fill="var(--signal)" />
                  <circle cx="122" cy="64" r="5" fill="var(--brass)" />
                </svg>
                <div className="hero-sweep" />
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="border border-[var(--rule)] bg-[rgba(16,19,24,0.55)] p-3">
                    <div className="text-[var(--muted)]">signals scanned</div>
                    <div className="mt-1 text-lg text-[var(--paper)]">{result.signals.length}</div>
                  </div>
                  <div className="border border-[var(--rule)] bg-[rgba(16,19,24,0.55)] p-3">
                    <div className="text-[var(--muted)]">lead matches</div>
                    <div className="mt-1 text-lg text-[var(--paper)]">{result.opportunities.length}</div>
                  </div>
                  <div className="border border-[var(--rule)] bg-[rgba(16,19,24,0.55)] p-3">
                    <div className="text-[var(--muted)]">best score</div>
                    <div className="mt-1 text-lg text-[var(--paper)]">{topScore}</div>
                  </div>
                  <div className="border border-[var(--rule)] bg-[rgba(16,19,24,0.55)] p-3">
                    <div className="text-[var(--muted)]">live sources</div>
                    <div className="mt-1 text-lg text-[var(--paper)]">{liveCount}/{sources.length}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
                {Object.entries(signalTypeCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between border border-[var(--rule)] bg-[rgba(16,19,24,0.45)] px-3 py-2">
                    <span className="uppercase tracking-[0.14em] text-[11px]">{type.replace("_", " ")}</span>
                    <span className="text-[var(--paper)]">{count}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-[var(--rule)] pt-4 text-sm text-[var(--muted)]">
                <div className="flex items-center justify-between">
                  <span>source health</span>
                  <span className="text-[var(--paper)]">ok {sourceStatusCounts.ok ?? 0} · fallback {sourceStatusCounts.fallback ?? 0} · error {sourceStatusCounts.error ?? 0}</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>top opportunity</span>
                    <span className="text-[var(--paper)]">{topOpportunity?.companyName ?? "none"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>top sector</span>
                    <span className="text-[var(--paper)]">{topOpportunity?.sector ?? workspace.brand?.sector ?? "General"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rule-section">
          <h2 className="text-[34px] leading-[1.15] md:text-[38px]">What it tracks</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="border border-[var(--rule)] bg-[rgba(237,234,224,0.03)] p-4">
              <div className="text-[var(--paper)]">Government procurement and tenders</div>
              <p className="mt-2 text-sm text-[var(--muted)]">See organizations buying, replacing, or expanding services.</p>
            </div>
            <div className="border border-[var(--rule)] bg-[rgba(237,234,224,0.03)] p-4">
              <div className="text-[var(--paper)]">Company registry and filing changes</div>
              <p className="mt-2 text-sm text-[var(--muted)]">Watch director changes, filings, and ownership signals.</p>
            </div>
            <div className="border border-[var(--rule)] bg-[rgba(237,234,224,0.03)] p-4">
              <div className="text-[var(--paper)]">Hiring velocity and market demand</div>
              <p className="mt-2 text-sm text-[var(--muted)]">Catch budget growth and internal change before the market notices.</p>
            </div>
            <div className="border border-[var(--rule)] bg-[rgba(237,234,224,0.03)] p-4">
              <div className="text-[var(--paper)]">Policy and regulatory movement</div>
              <p className="mt-2 text-sm text-[var(--muted)]">Track fresh rules, consultations, and government notices.</p>
            </div>
            <div className="border border-[var(--rule)] bg-[rgba(237,234,224,0.03)] p-4">
              <div className="text-[var(--paper)]">Local planning and infrastructure signals</div>
              <p className="mt-2 text-sm text-[var(--muted)]">Identify construction, expansion, and regional spending.</p>
            </div>
            <div className="border border-[var(--rule)] bg-[rgba(237,234,224,0.03)] p-4">
              <div className="text-[var(--paper)]">News and narrative momentum</div>
              <p className="mt-2 text-sm text-[var(--muted)]">Spot moments when the story is moving and timing matters.</p>
            </div>
          </div>
        </section>

        <section className="rule-section">
          <h2 className="text-[34px] leading-[1.15] md:text-[38px]">How it works</h2>
          <ol className="mt-7 max-w-[68ch] space-y-4 text-[var(--muted)]">
            <li><span className="data-mono mr-3 text-[var(--brass)]">1.</span> Pick the regions and sectors you care about.</li>
            <li><span className="data-mono mr-3 text-[var(--brass)]">2.</span> Pull public signals from live open APIs and RSS feeds.</li>
            <li><span className="data-mono mr-3 text-[var(--brass)]">3.</span> Score them into leads by confidence and fit.</li>
            <li><span className="data-mono mr-3 text-[var(--brass)]">4.</span> Use Gemini to turn the best leads into outreach plans.</li>
          </ol>
        </section>

        <section className="rule-section">
          <div className="mb-6 flex items-end justify-between gap-3">
            <h2 className="text-[34px] leading-[1.15] md:text-[38px]">Top leads right now</h2>
            <a href="/api/opportunities?refresh=1" className="data-mono text-[var(--brass)] hover:opacity-80">
              refresh feed
            </a>
          </div>

          <p className="max-w-[68ch] text-sm text-[var(--muted)]">
            These are the strongest current matches from public sources. If you want a broader list, add more sectors or regions in settings.
          </p>

          <div className="border-y border-[var(--rule)]">
            {result.opportunities.slice(0, 8).map((item) => (
              <div key={`${item.companyName}-${item.lastUpdatedAt}`} className="grid gap-3 border-t border-[var(--rule)] py-4 first:border-t-0 md:grid-cols-[minmax(0,1fr)_130px]">
                <div>
                  <div className="text-[var(--paper)]">{item.companyName}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">{item.location} · {item.sector}</div>
                  <p className="mt-2 max-w-[68ch] text-sm text-[var(--muted)]">{item.reasons.slice(0, 2).join("; ")}</p>
                </div>
                <div className="data-mono text-right">
                  <div className="text-[var(--brass)]">score {item.score}</div>
                  <div className="mt-1 text-[var(--signal)]">conf {Math.round(item.confidence * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rule-section">
          <h2 className="text-[34px] leading-[1.15] md:text-[38px]">Latest signals</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {topSignals.map((signal) => (
              <div key={signal.id} className="border border-[var(--rule)] bg-[rgba(237,234,224,0.03)] p-4">
                <div className="data-mono text-[var(--brass)]">{signal.source}</div>
                <div className="mt-3 text-[var(--paper)]">{signal.title}</div>
                <p className="mt-2 text-sm text-[var(--muted)]">{signal.summary}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{signal.location}</span>
                  <span>{Math.round(signal.confidence * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rule-section">
          <h2 className="text-[34px] leading-[1.15] md:text-[38px]">Coverage map</h2>
          <div className="mt-6 overflow-hidden border border-[var(--rule)] bg-[rgba(237,234,224,0.02)] p-4">
            <svg viewBox="0 0 960 220" className="h-auto w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 166C130 90 210 90 318 129C431 170 541 160 650 114C739 76 840 80 940 144" stroke="var(--brass)" strokeWidth="1" />
              <path d="M40 198C158 130 255 131 356 168C457 205 541 204 652 176C758 149 841 144 922 181" stroke="var(--signal)" strokeWidth="1" strokeDasharray="5 6" />
              <circle cx="356" cy="168" r="4" fill="var(--signal)" />
              <circle cx="650" cy="114" r="4" fill="var(--brass)" />
            </svg>
          </div>
        </section>
      </div>
    </div>
  );
}
