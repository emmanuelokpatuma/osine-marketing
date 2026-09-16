import { OpportunityCard } from "@/components/opportunity-card";
import { runPipeline } from "@/lib/pipeline";
import { getPipeline } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const result = (await getPipeline()) ?? (await runPipeline());

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Investor Mode</p>
          <h2 className="mt-1 text-3xl leading-tight">Global Opportunity Radar</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
            Evidence-backed OSINT signals converted into ranked opportunities for your UK market focus.
          </p>
        </div>
        <a
          href="/api/opportunities?refresh=1"
          className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:brightness-110"
        >
          Refresh Feed
        </a>
      </div>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-4">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]">Signals</div>
          <div className="mt-1 text-2xl font-semibold">{result.signals.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-4">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]">Opportunities</div>
          <div className="mt-1 text-2xl font-semibold">{result.opportunities.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-4">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]">Generated</div>
          <div className="mt-1 text-sm font-medium">{new Date(result.generatedAt).toLocaleString()}</div>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="text-xl">Top opportunities</h3>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {result.opportunities.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-5 text-sm text-[var(--color-muted)]">
              No opportunities yet. Add more entities in Signal Profiles to increase coverage.
            </div>
          ) : (
            result.opportunities.slice(0, 12).map((item) => (
              <OpportunityCard key={`${item.companyName}-${item.lastUpdatedAt}`} opportunity={item} />
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h3 className="text-xl">Source health</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--color-rule)] bg-white/85">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-rule)] bg-[var(--color-panel)] text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {result.sourceHealth.map((item) => (
                <tr key={item.source} className="border-b border-[var(--color-rule)] last:border-b-0">
                  <td className="px-4 py-3">{item.source}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">{item.records}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{item.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
