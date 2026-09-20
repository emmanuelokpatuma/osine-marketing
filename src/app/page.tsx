import { catalogForRegions } from "@/lib/source-catalog";
import { runPipeline } from "@/lib/pipeline";
import { getPipeline, getWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const workspace = await getWorkspace();
  const sources = catalogForRegions(workspace.monitorConfig.regions);
  const liveCount = sources.filter((source) => source.status === "live").length;
  const result = (await getPipeline()) ?? (await runPipeline());

  return (
    <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="data-mono lg:sticky lg:top-10 lg:h-fit">
        <div className="kicker">Console telemetry</div>
        <div className="mt-4 space-y-2 text-[var(--muted)]">
          <div>grid position: 54.0000 N / 2.0000 W</div>
          <div>signals: {result.signals.length}</div>
          <div>opportunities: {result.opportunities.length}</div>
          <div>live sources: {liveCount}/{sources.length}</div>
          <div>refresh: {workspace.monitorConfig.refreshSeconds}s</div>
          <div>regions: {workspace.monitorConfig.regions.join(", ")}</div>
          <div>timestamp: {new Date(result.generatedAt).toISOString()}</div>
        </div>

        <div className="mt-10 border-t border-[var(--rule)] pt-5 text-[var(--signal)]">
          live signal: active
        </div>
      </aside>

      <div>
        <section className="relative overflow-hidden pb-12">
          <div className="hero-map" aria-hidden>
            <svg viewBox="0 0 1200 380" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 202C112 160 189 148 262 167C318 181 362 175 415 149C473 120 540 115 604 131C651 143 698 169 742 171C804 173 856 136 914 133C972 130 1038 160 1156 205" stroke="var(--brass)" strokeOpacity="0.45" />
              <path d="M66 238C130 208 189 205 253 221C312 236 371 224 425 198C489 168 548 167 611 182C669 196 726 225 782 227C842 230 901 199 961 193C1031 186 1095 214 1168 240" stroke="var(--brass)" strokeOpacity="0.35" />
              <path d="M232 115L309 150L401 148L523 102L627 103L754 130L858 121L969 142" stroke="var(--signal)" strokeOpacity="0.45" strokeDasharray="4 5" />
            </svg>
            <div className="hero-sweep" />
          </div>

          <p className="kicker">Global signal intelligence, configured like an instrument</p>
          <h1 className="mt-4 max-w-[18ch] text-[46px] leading-[1.05] tracking-[-0.02em] text-[var(--paper)] md:text-[72px]">
            Read the market like a navigation instrument.
          </h1>
          <p className="mt-7 max-w-[68ch] text-base leading-[1.6] text-[var(--muted)]">
            Global Opportunity Radar turns open-source noise into clear operational signals. Track procurement, hiring, company filings, and regional policy movement with evidence you can act on.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/live" className="instrument-button instrument-button-primary">
              Open live monitor
            </a>
            <a href="/settings" className="instrument-button instrument-button-quiet">
              Configure regions
            </a>
          </div>
        </section>

        <section className="rule-section">
          <h2 className="text-[34px] leading-[1.15] md:text-[38px]">Signal classes in this console</h2>
          <div className="mt-6 grid gap-2 text-[var(--muted)] md:grid-cols-2">
            <div>Government procurement and tenders</div>
            <div>Company registry and filing changes</div>
            <div>Hiring velocity and market demand</div>
            <div>Policy and regulatory movement</div>
            <div>Local planning and infrastructure signals</div>
            <div>News and narrative momentum</div>
          </div>
        </section>

        <section className="rule-section">
          <h2 className="text-[34px] leading-[1.15] md:text-[38px]">How operation flows</h2>
          <ol className="mt-7 max-w-[68ch] space-y-4 text-[var(--muted)]">
            <li><span className="data-mono mr-3 text-[var(--brass)]">1.</span> Select regions and service targets in signal profiles.</li>
            <li><span className="data-mono mr-3 text-[var(--brass)]">2.</span> Ingest open signals from the public-api registry stack.</li>
            <li><span className="data-mono mr-3 text-[var(--brass)]">3.</span> Rank opportunities by confidence and commercial fit.</li>
            <li><span className="data-mono mr-3 text-[var(--brass)]">4.</span> Execute outreach from the live feed before market response catches up.</li>
          </ol>
        </section>

        <section className="rule-section">
          <div className="mb-6 flex items-end justify-between gap-3">
            <h2 className="text-[34px] leading-[1.15] md:text-[38px]">Top opportunities right now</h2>
            <a href="/api/opportunities?refresh=1" className="data-mono text-[var(--brass)] hover:opacity-80">
              refresh feed
            </a>
          </div>

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
          <h2 className="text-[34px] leading-[1.15] md:text-[38px]">Global linework</h2>
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
