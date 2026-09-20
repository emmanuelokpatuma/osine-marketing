import { buildLeadRows } from "@/lib/leadgen";
import { getLeadInsight } from "@/lib/lead-insight";
import { runPipeline } from "@/lib/pipeline";
import { getPipeline, getWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: { sectors?: string };
}) {
  const workspace = await getWorkspace();
  const pipeline = (await getPipeline()) ?? (await runPipeline());
  const sectors = searchParams?.sectors
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const rows = buildLeadRows(workspace, pipeline.opportunities, { sectors });
  const insight = await getLeadInsight(workspace, rows);

  const realEstateTemplate = [
    "Hi,",
    "We track public market signals that often indicate timing-sensitive opportunities.",
    "If you’re open to it, I can share a short, compliant summary of the current signals in your area.",
    "Best regards,",
    workspace.brand?.name ?? "Global Opportunity Radar",
  ].join("\n");

  const smallBusinessTemplate = [
    "Hi,",
    "We monitor public signals that show when local businesses are likely to need support.",
    "Would it be useful if I shared a short summary of the most relevant opportunities we see for your sector?",
    "Best regards,",
    workspace.brand?.name ?? "Global Opportunity Radar",
  ].join("\n");

  return (
    <div className="space-y-10">
      <section className="rule-section">
        <p className="kicker">Lead export</p>
        <h1 className="mt-4 max-w-[18ch] text-[46px] leading-[1.05] tracking-[-0.02em] text-[var(--paper)] md:text-[72px]">
          Compliant leads, ready to export.
        </h1>
        <p className="mt-6 max-w-[68ch] text-base leading-[1.6] text-[var(--muted)]">
          This view filters public opportunities through your consent and suppression settings, then exports a CRM-ready list with a suggested outreach channel and a compliant first-touch template.
        </p>
        <p className="mt-4 max-w-[68ch] text-sm leading-[1.6] text-[var(--muted)]">
          Active sector filter: {sectors?.length ? sectors.join(", ") : workspace.leadGenConfig.targetSectors.length ? workspace.leadGenConfig.targetSectors.join(", ") : "all sectors"}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={`/api/leads?format=csv${sectors?.length ? `&sectors=${encodeURIComponent(sectors.join(","))}` : ""}`} className="instrument-button instrument-button-primary">
            Download CSV
          </a>
          <a href="/settings" className="instrument-button instrument-button-quiet">
            Review compliance settings
          </a>
        </div>
      </section>

      <section className="rule-section grid gap-4 md:grid-cols-4">
        <div>
          <div className="kicker">exported</div>
          <div className="mt-2 data-mono text-[var(--paper)]">{rows.length}</div>
        </div>
        <div>
          <div className="kicker">consent</div>
          <div className="mt-2 data-mono text-[var(--paper)]">{workspace.leadGenConfig.consentRequired ? "required" : "review"}</div>
        </div>
        <div>
          <div className="kicker">channels</div>
          <div className="mt-2 data-mono text-[var(--paper)]">{workspace.leadGenConfig.allowedChannels.join(", ")}</div>
        </div>
        <div>
          <div className="kicker">suppression</div>
          <div className="mt-2 data-mono text-[var(--paper)]">{workspace.leadGenConfig.suppressionList.length} entries</div>
        </div>
      </section>

      <section className="rule-section">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="kicker">AI outreach brief</p>
            <h2 className="mt-3 text-[34px] leading-[1.15] md:text-[38px]">Gemini-generated message guidance</h2>
          </div>
          <div className="rounded-full border border-[var(--rule)] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            {insight.model}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[var(--rule)] p-5">
            <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Summary</div>
            <p className="mt-3 max-w-[68ch] text-[var(--paper)]">{insight.summary}</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Industry focus</div>
                <p className="mt-2 text-[var(--paper)]">{insight.industryFocus}</p>
              </div>
              <div>
                <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Best channel</div>
                <p className="mt-2 text-[var(--paper)] capitalize">{insight.bestChannel}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Subject line</div>
                <p className="mt-2 text-[var(--paper)]">{insight.subjectLine}</p>
              </div>
              <div>
                <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Contact strategy</div>
                <p className="mt-2 text-[var(--paper)]">{insight.contactStrategy}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Opening angle</div>
              <p className="mt-2 text-[var(--paper)]">{insight.openingAngle}</p>
            </div>

            <div className="mt-5">
              <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Suggested CTA</div>
              <p className="mt-2 text-[var(--paper)]">{insight.suggestedCTA}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-[var(--rule)] p-5">
              <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Proof points</div>
              <ul className="mt-3 space-y-2 text-sm text-[var(--paper)]">
                {insight.proofPoints.length ? insight.proofPoints.map((point) => <li key={point}>• {point}</li>) : <li>• No top proof points available.</li>}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--rule)] p-5">
              <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Compliance notes</div>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {insight.complianceNotes.length ? insight.complianceNotes.map((note) => <li key={note}>• {note}</li>) : <li>• Keep outreach consent-aware and channel-specific.</li>}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--rule)] p-5">
              <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">How to use this lead</div>
              <ul className="mt-3 space-y-2 text-sm text-[var(--paper)]">
                {insight.leadUseCases.length ? insight.leadUseCases.map((item) => <li key={item}>• {item}</li>) : <li>• Use it to start a relevant, compliant conversation.</li>}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--rule)] p-5">
              <div className="text-sm uppercase tracking-[0.14em] text-[var(--muted)]">Next actions</div>
              <ul className="mt-3 space-y-2 text-sm text-[var(--paper)]">
                {insight.nextActions.length ? insight.nextActions.map((item) => <li key={item}>• {item}</li>) : <li>• Tailor the message, then route it into CRM.</li>}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="rule-section">
        <h2 className="text-[34px] leading-[1.15] md:text-[38px]">Ready-to-use lead rows</h2>
        <div className="mt-6 border-y border-[var(--rule)]">
          {rows.slice(0, 10).map((row) => (
            <div key={`${row.companyName}-${row.location}`} className="grid gap-3 border-t border-[var(--rule)] py-4 first:border-t-0 md:grid-cols-[minmax(0,1fr)_140px]">
              <div>
                <div className="text-[var(--paper)]">{row.companyName}</div>
                <div className="mt-1 text-sm text-[var(--muted)]">{row.location} · {row.sector}</div>
                <p className="mt-2 max-w-[68ch] text-sm text-[var(--muted)]">{row.recommendedAction}</p>
              </div>
              <div className="data-mono text-right">
                <div className="text-[var(--brass)]">{row.compliance}</div>
                <div className="mt-1 text-[var(--signal)]">score {row.score}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rule-section">
          <h2 className="text-[34px] leading-[1.15] md:text-[38px]">Real estate outreach template</h2>
          <pre className="mt-5 whitespace-pre-wrap border border-[var(--rule)] p-4 text-sm leading-[1.6] text-[var(--muted)]">{realEstateTemplate}</pre>
        </div>

        <div className="rule-section">
          <h2 className="text-[34px] leading-[1.15] md:text-[38px]">Small business outreach template</h2>
          <pre className="mt-5 whitespace-pre-wrap border border-[var(--rule)] p-4 text-sm leading-[1.6] text-[var(--muted)]">{smallBusinessTemplate}</pre>
        </div>
      </section>

      <section className="rule-section">
        <h2 className="text-[34px] leading-[1.15] md:text-[38px]">Export feed</h2>
        <p className="mt-4 max-w-[68ch] text-[var(--muted)]">
          Use the CSV export in a CRM, email platform, or audience tool. The app stays on the compliant side by keeping first-party constraints and suppression controls in place.
        </p>
      </section>
    </div>
  );
}