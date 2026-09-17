import { OpportunityCard } from "@/components/opportunity-card";
import { catalogForRegions } from "@/lib/source-catalog";
import { runPipeline } from "@/lib/pipeline";
import { getPipeline, getWorkspace } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const workspace = await getWorkspace();
  const sources = catalogForRegions(workspace.monitorConfig.regions);
  const liveCount = sources.filter((source) => source.status === "live").length;
  const result = (await getPipeline()) ?? (await runPipeline());

  const trustSignals = [
    "Public-source intelligence",
    "Region-aware monitoring",
    "Evidence-backed scoring",
    "Business opportunity ranking",
    "Free-first deployment",
  ];

  const useCases = [
    {
      title: "B2B prospecting",
      text: "Find companies with active buying intent using procurement, hiring, expansion, and public market signals.",
    },
    {
      title: "Market monitoring",
      text: "Track target countries, sectors, and niches without manually trawling fragmented public data sources.",
    },
    {
      title: "Procurement intelligence",
      text: "Monitor tenders and public-sector demand earlier so teams can act before competitors respond.",
    },
    {
      title: "Growth and partnership discovery",
      text: "Spot expansion moves, local activity, and sector momentum that signal the right inbound or partnership opportunity.",
    },
  ];

  const steps = [
    "Choose target regions, industries, and market profiles.",
    "Monitor public data sources continuously for fresh signals.",
    "Score opportunities using urgency, relevance, and evidence.",
    "Prioritize outreach with a ranked deal pipeline.",
  ];

  const sourceGroups = [
    "Government procurement databases",
    "Company registries and filings",
    "Regional public data portals",
    "News and press feeds",
    "Hiring and job market signals",
    "Planning and infrastructure activity",
  ];

  const pricing = [
    {
      name: "Starter",
      price: "$19",
      description: "For founders and solo operators building early pipeline.",
      features: ["1 workspace", "1 target region", "Opportunity dashboard", "Core signal monitoring"],
      featured: false,
    },
    {
      name: "Growth",
      price: "$79",
      description: "For sales teams and growth agencies tracking multiple markets.",
      features: ["Unlimited profiles", "Multi-region monitoring", "Priority alerts", "Advanced ranking filters"],
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams with custom sourcing, reporting, and workflow needs.",
      features: ["Custom source coverage", "Advanced reporting", "Workflow integrations", "Dedicated onboarding"],
      featured: false,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="rounded-[24px] border border-[var(--color-rule)] bg-white/80 px-5 py-3 backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-semibold text-white">
              G
            </div>
            <div>
              <div className="text-sm font-semibold">Global Opportunity Radar</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">Public-source intelligence</div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
            <a href="#problem" className="hover:text-[var(--color-ink)]">Problem</a>
            <a href="#solution" className="hover:text-[var(--color-ink)]">Solution</a>
            <a href="#pricing" className="hover:text-[var(--color-ink)]">Pricing</a>
            <a href="/live" className="rounded-lg border border-[var(--color-rule)] bg-white px-3 py-1.5 font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)]">
              Live monitor
            </a>
          </nav>
        </div>
      </header>

      <section className="rounded-[28px] border border-[var(--color-rule)] bg-[linear-gradient(135deg,rgba(85,107,47,0.11),rgba(122,140,86,0.10),rgba(255,255,255,0.92))] p-6 shadow-[0_20px_50px_rgba(85,107,47,0.08)] backdrop-blur-sm md:p-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Public-source intelligence</p>
            <h1 className="mt-3 max-w-2xl text-4xl leading-tight md:text-5xl">
              Discover better opportunities before competitors do.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-[var(--color-muted)]">
              Global Opportunity Radar monitors public signals across regions, companies, hiring activity, news, and procurement to reveal more relevant leads and higher-fit opportunities for sales and growth teams.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/live"
                className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110"
              >
                View live monitor
              </a>
              <a
                href="/settings"
                className="rounded-xl border border-[var(--color-rule)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)]"
              >
                Configure targets
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
              <span>Global coverage</span>
              <span>•</span>
              <span>Free/public sources</span>
              <span>•</span>
              <span>Evidence-backed scoring</span>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--color-rule)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(232,239,223,0.96))] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">Live snapshot</div>
                <div className="mt-2 text-2xl font-semibold">{result.opportunities.length} opportunities</div>
              </div>
              <div className="rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]">
                Live
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-3">
                <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)]">Signals tracked</div>
                <div className="mt-1 text-xl font-semibold">{result.signals.length}</div>
              </div>
              <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-3">
                <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)]">Sources online</div>
                <div className="mt-1 text-xl font-semibold">{liveCount}/{sources.length}</div>
              </div>
              <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-3">
                <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)]">Target regions</div>
                <div className="mt-1 text-sm font-medium">{workspace.monitorConfig.regions.join(", ")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[var(--color-rule)] bg-[linear-gradient(135deg,rgba(85,107,47,0.08),rgba(122,140,86,0.08),rgba(255,255,255,0.9))] p-4">
        <div className="flex flex-wrap gap-2">
          {trustSignals.map((signal) => (
            <span
              key={signal}
              className="rounded-full border border-[var(--color-rule)] bg-white/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]"
            >
              {signal}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-4">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]">Markets</div>
          <div className="mt-2 text-2xl font-semibold">{workspace.monitorConfig.regions.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-4">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]">Source types</div>
          <div className="mt-2 text-2xl font-semibold">{sourceGroups.length + 2}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-4">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]">High-fit leads</div>
          <div className="mt-2 text-2xl font-semibold">{result.opportunities.filter((item) => item.score >= 75).length}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-rule)] bg-white/80 p-4">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]">Update cadence</div>
          <div className="mt-2 text-sm font-medium">Every {workspace.monitorConfig.refreshSeconds}s</div>
        </div>
      </section>

      <section id="problem" className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--color-rule)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(235,241,255,0.92))] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">The problem</p>
          <h2 className="mt-2 text-3xl">Most opportunity data is fragmented and too late to act on.</h2>
          <p className="mt-4 text-[var(--color-muted)]">
            Public data is everywhere, but spread across procurement portals, news feeds, public registries, and local sources. Teams still waste time on stale lists and manual research instead of focusing on active opportunities.
          </p>
        </div>

        <div id="solution" className="rounded-[28px] border border-[var(--color-rule)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(231,239,220,0.92))] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">The solution</p>
          <h2 className="mt-2 text-3xl">Bring public-source intelligence into one live workflow.</h2>
          <p className="mt-4 text-[var(--color-muted)]">
            Global Opportunity Radar tracks target regions, sectors, and companies continuously, then scores and ranks signals based on market fit, urgency, and evidence. The result is a cleaner, more actionable pipeline.
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--color-rule)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,242,229,0.94))] p-6 md:p-8">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Use cases</p>
          <h2 className="mt-2 text-3xl">Built for sales, growth, and market intelligence teams.</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {useCases.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-panel)] p-5">
              <div className="text-lg font-semibold">{item.title}</div>
              <p className="mt-3 text-sm text-[var(--color-muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-[var(--color-rule)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,242,229,0.94))] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">How it works</p>
          <h2 className="mt-2 text-3xl">Simple workflow, stronger pipeline.</h2>

          <div className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-panel)] p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div className="text-sm text-[var(--color-muted)]">{step}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--color-rule)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(233,240,224,0.94))] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Source coverage</p>
          <h2 className="mt-2 text-3xl">Global public-source intelligence</h2>
          <ul className="mt-5 space-y-3 text-sm text-[var(--color-muted)]">
            {sourceGroups.map((source) => (
              <li key={source} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                <span>{source}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--color-rule)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,246,231,0.96))] p-6 md:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Opportunity feed</p>
            <h2 className="mt-2 text-3xl">Ranked opportunities from public-source signals</h2>
          </div>
          <a href="/api/opportunities?refresh=1" className="text-sm font-medium text-[var(--color-accent)] hover:underline">
            Refresh feed
          </a>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {result.opportunities.slice(0, 6).map((item) => (
            <OpportunityCard key={`${item.companyName}-${item.lastUpdatedAt}`} opportunity={item} />
          ))}
        </div>
      </section>

      <section id="pricing" className="rounded-[28px] border border-[var(--color-rule)] bg-[linear-gradient(135deg,#556b2f_0%,#7a8c56_54%,#a88a40_100%)] p-8 text-white shadow-[0_20px_50px_rgba(85,107,47,0.25)]">
        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Ready to move faster?</p>
            <h2 className="mt-2 text-3xl">Find the next opportunity before others do.</h2>
          </div>
          <div className="flex gap-3">
            <a
              href="/live"
              className="rounded-xl border border-white/40 bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink)]"
            >
              View live monitor
            </a>
            <a
              href="/settings"
              className="rounded-xl border border-white/40 px-4 py-2.5 text-sm font-medium text-white"
            >
              Configure targets
            </a>
          </div>
        </div>
      </section>

      <footer className="pb-4 text-center text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]">
        Global Opportunity Radar • Public-source intelligence for better pipeline decisions
      </footer>
    </div>
  );
}
