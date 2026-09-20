"use client";

import { useMemo, useState } from "react";

type LeadGeneratorResponse = {
  generatedAt: string;
  prompt: string;
  country: string;
  mode: "priority" | "all";
  availableCountries: string[];
  opportunityCount: number;
  leadCount: number;
  opportunities: Array<{
    companyName: string;
    location: string;
    sector: string;
    score: number;
    confidence: number;
    reasons: string[];
    recommendedAction: string;
  }>;
  leads: Array<{
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
  }>;
  insight: {
    summary: string;
    industryFocus: string;
    subjectLine: string;
    openingAngle: string;
    bestChannel: string;
    contactStrategy: string;
    leadUseCases: string[];
    nextActions: string[];
    proofPoints: string[];
    complianceNotes: string[];
    suggestedCTA: string;
    model: string;
  };
};

export function LeadGenerator({
  countries,
  defaultCountry = "All countries",
}: {
  countries: string[];
  defaultCountry?: string;
}) {
  const countryChoices = useMemo(() => ["All countries", ...countries], [countries]);
  const prioritySectors = useMemo(
    () => [
      "Retail and grocery",
      "Energy and utilities",
      "Real estate",
      "Technology",
      "Healthcare",
      "Financial services",
      "Manufacturing and logistics",
    ],
    [],
  );
  const leadModes = useMemo(
    () => [
      {
        title: "Retail and grocery",
        description: "Store rollouts, procurement, logistics, and category expansion signals.",
        prompt:
          "Find retail and grocery opportunities, including chains such as Asda and Morrisons plus regional operators. Use expansion, procurement, and hiring signals to identify high-intent buyers.",
      },
      {
        title: "Energy and utilities",
        description: "Net-zero, utility procurement, smart metering, and grid modernization signals.",
        prompt:
          "Find energy and utility opportunities including smart metering, DCC-related programmes, grid upgrades, and supplier demand. Return the strongest opportunities and compliant lead actions.",
      },
      {
        title: "Real estate",
        description: "Land, planning, occupancy, development, and commercial property signals.",
        prompt:
          "Find real estate opportunities in the selected country. Include planning applications, development activity, landlord and occupier expansion, and supplier-relevant buying intent.",
      },
      {
        title: "Technology",
        description: "Cloud, AI, cybersecurity, software, and platform-transformation buyer signals.",
        prompt:
          "Find technology buyers showing intent through hiring, funding, platform migration, security upgrades, and product expansion. Return top opportunities and compliant outreach actions.",
      },
      {
        title: "Healthcare",
        description: "Trusts, clinics, providers, compliance, and procurement signals.",
        prompt:
          "Find healthcare opportunities that show buying intent from procurement, hiring, compliance, and operational change. Return all matching opportunities and the best leads.",
      },
      {
        title: "Financial services",
        description: "Banking, fintech, insurance, and regulatory change signals.",
        prompt:
          "Find financial-services and fintech opportunities tied to risk, compliance, platform modernization, payments, and hiring trends. Return high-intent leads and next actions.",
      },
      {
        title: "Manufacturing and logistics",
        description: "Supply-chain, warehousing, production, and distribution demand signals.",
        prompt:
          "Find manufacturing and logistics opportunities using planning, hiring, warehouse, procurement, and transport expansion signals. Return high-confidence buyer leads and actions.",
      },
    ],
    [],
  );

  const signalWatchlist = useMemo(
    () => [
      {
        title: "Google business / maps",
        description: "Find businesses by address, category, and geo location.",
      },
      {
        title: "Reddit / community chatter",
        description: "Track public subreddit discussions and community signals.",
      },
      {
        title: "Events / conferences",
        description: "Watch speaker lists, sponsors, schedules, and venue announcements.",
      },
      {
        title: "Property / location",
        description: "Use addresses, geolocation, planning, and occupancy signals.",
      },
      {
        title: "Funding / investors",
        description: "Surface companies that just raised, are hiring, or are scaling fast.",
      },
      {
        title: "Grant portals",
        description: "Monitor government and company grant listings for SMEs and sector funding.",
      },
      {
        title: "Energy and utilities",
        description: "Watch DCC, grid programmes, and utility procurement notices.",
      },
      {
        title: "Research funding",
        description: "Track research councils, universities, innovation calls, and R&D awards.",
      },
      {
        title: "Food retail chains",
        description: "Follow grocery store expansion, buyer demand, and supplier opportunities.",
      },
      {
        title: "Ad signals",
        description: "Use public ad or transparency sources where available; Google/YouTube ad APIs require access.",
      },
    ],
    [],
  );

  const [prompt, setPrompt] = useState(
    "Find the strongest opportunities for buyers ready to move now. Group the results by the selected country and explain what each lead needs.",
  );
  const [country, setCountry] = useState(defaultCountry);
  const [mode, setMode] = useState<"priority" | "all">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadGeneratorResponse | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/leads/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, country, mode }),
      });

      if (!response.ok) {
        throw new Error(`Lead generation failed with status ${response.status}`);
      }

      const data = (await response.json()) as LeadGeneratorResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lead generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rule-section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Prompt chat</p>
          <h2 className="mt-3 text-[34px] leading-[1.15] md:text-[38px]">Build a full lead generator from one prompt</h2>
          <p className="mt-3 max-w-[70ch] text-sm text-[var(--muted)]">
            Describe the buyer, sector, urgency, event, grant, or market signal. The generator returns demand and need signals across the selected country, including procurement, hiring, expansion, grants, and market movement.
          </p>
        </div>
        <button onClick={generate} className="instrument-button instrument-button-primary" disabled={loading}>
          {loading ? "Generating..." : "Generate leads"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="premium-panel p-5">
          <div className="flex flex-wrap gap-2">
            {leadModes.map((profile) => (
              <button
                key={profile.title}
                type="button"
                onClick={() => setPrompt(profile.prompt)}
                className="trust-chip text-left transition hover:opacity-90"
                title={profile.description}
              >
                {profile.title}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("all")}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                mode === "all"
                  ? "border-[var(--signal)] bg-[rgba(46,110,100,0.16)]"
                  : "border-[var(--rule)] bg-[rgba(16,19,24,0.45)]"
              }`}
            >
              <div className="text-[var(--paper)]">All-seeing eye mode</div>
              <div className="mt-1 text-[var(--muted)]">Track all sectors and surface any strong demand signal.</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("priority")}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                mode === "priority"
                  ? "border-[var(--signal)] bg-[rgba(46,110,100,0.16)]"
                  : "border-[var(--rule)] bg-[rgba(16,19,24,0.45)]"
              }`}
            >
              <div className="text-[var(--paper)]">Priority 7 lens</div>
              <div className="mt-1 text-[var(--muted)]">Focus scoring on the seven strategic sectors first.</div>
            </button>
          </div>

          {mode === "priority" ? (
            <div className="mt-3 rounded-2xl border border-[var(--rule)] bg-[rgba(16,19,24,0.45)] p-3 text-xs text-[var(--muted)]">
              Priority sectors: {prioritySectors.join(" | ")}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-[var(--rule)] bg-[rgba(16,19,24,0.45)] p-3 text-xs text-[var(--muted)]">
              All sectors active: the seven priority sectors still receive stronger ranking weight.
            </div>
          )}

          <label className="block text-sm text-[var(--muted)]">
            What do you want Gemini to find?
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="mt-3 min-h-40 w-full rounded-2xl border border-[var(--rule)] bg-[rgba(16,19,24,0.72)] p-4 text-[var(--paper)] outline-none transition focus:border-[var(--brass)]"
              placeholder="Example: Find public sector buyers in the UK that are showing signs of cloud migration, security work, or platform refresh."
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={generate} className="instrument-button instrument-button-primary" disabled={loading}>
              {loading ? "Generating..." : "Run generator"}
            </button>
            <a href="/api/leads?format=csv" className="instrument-button instrument-button-quiet">
              Export all CSV
            </a>
          </div>

          {error ? <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p> : null}

          {result ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="sector-card p-4">
                  <div className="kicker uppercase tracking-[0.16em] text-[11px]">country</div>
                  <div className="mt-2 text-[var(--paper)]">{result.country}</div>
                </div>
                <div className="sector-card p-4">
                  <div className="kicker uppercase tracking-[0.16em] text-[11px]">scan mode</div>
                  <div className="mt-2 text-[var(--paper)]">{result.mode === "priority" ? "Priority 7 lens" : "All-seeing eye"}</div>
                </div>
                <div className="sector-card p-4">
                  <div className="kicker uppercase tracking-[0.16em] text-[11px]">opportunities</div>
                  <div className="mt-2 text-[var(--paper)]">{result.opportunityCount}</div>
                </div>
                <div className="sector-card p-4">
                  <div className="kicker uppercase tracking-[0.16em] text-[11px]">leads</div>
                  <div className="mt-2 text-[var(--paper)]">{result.leadCount}</div>
                </div>
              </div>

              <div className="sector-card p-4">
                <div className="kicker uppercase tracking-[0.16em] text-[11px]">Gemini brief</div>
                <p className="mt-2 text-[var(--paper)]">{result.insight.summary}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Focus</div>
                    <div className="mt-1 text-sm text-[var(--paper)]">{result.insight.industryFocus}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Best channel</div>
                    <div className="mt-1 text-sm text-[var(--paper)]">{result.insight.bestChannel}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="sector-card p-4">
                  <div className="kicker uppercase tracking-[0.16em] text-[11px]">top opportunities</div>
                  <div className="mt-3 max-h-96 space-y-3 overflow-auto pr-1">
                    {result.opportunities.map((item) => (
                      <div key={`${item.companyName}-${item.location}`} className="border-t border-[var(--rule)] pt-3 first:border-t-0 first:pt-0">
                        <div className="text-sm text-[var(--paper)]">{item.companyName}</div>
                        <div className="mt-1 text-xs text-[var(--muted)]">{item.location} · {item.sector}</div>
                        <div className="mt-2 text-xs text-[var(--muted)]">score {item.score} · conf {Math.round(item.confidence * 100)}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sector-card p-4">
                  <div className="kicker uppercase tracking-[0.16em] text-[11px]">ready leads</div>
                  <div className="mt-3 max-h-96 space-y-3 overflow-auto pr-1">
                    {result.leads.map((item) => (
                      <div key={`${item.companyName}-${item.location}`} className="border-t border-[var(--rule)] pt-3 first:border-t-0 first:pt-0">
                        <div className="text-sm text-[var(--paper)]">{item.companyName}</div>
                        <div className="mt-1 text-xs text-[var(--muted)]">{item.location} · {item.sector}</div>
                        <div className="mt-2 text-xs text-[var(--muted)]">{item.compliance} · {item.channel} · score {item.score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="premium-panel p-5">
          <div className="kicker uppercase tracking-[0.16em] text-[11px]">Countries</div>
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-[var(--rule)] bg-[rgba(16,19,24,0.72)] px-4 py-3 text-[var(--paper)] outline-none transition focus:border-[var(--brass)]"
          >
            {countryChoices.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="mt-4 rounded-2xl border border-[var(--rule)] bg-[rgba(16,19,24,0.55)] p-4 text-sm text-[var(--muted)]">
            Pick a country, describe the buyer or market, and the generator will bring back all matching opportunities and leads for that location.
          </div>

          <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <div className="border-t border-[var(--rule)] pt-3">
              <span className="text-[var(--paper)]">Tip:</span> ask for sector-specific buyers, urgency, or campaign ideas.
            </div>
            <div className="border-t border-[var(--rule)] pt-3">
              <span className="text-[var(--paper)]">Example:</span> “Show me angel investors and SME grant opportunities in the UK, then draft a compliant outreach plan.”
            </div>
            <div className="border-t border-[var(--rule)] pt-3">
              <span className="text-[var(--paper)]">Open watch sources:</span> Google News, Reddit, event pages, company records, planning, procurement, grant portals, and research databases.
            </div>
            <div className="border-t border-[var(--rule)] pt-3">
              <span className="text-[var(--paper)]">Demand and need signals:</span> supplier demand, hiring demand, procurement, grants, policy movement, and expansion activity.
            </div>
          </div>

          <div className="mt-6">
            <div className="kicker uppercase tracking-[0.16em] text-[11px]">Watchlist</div>
            <div className="mt-3 space-y-2">
              {signalWatchlist.map((item) => (
                <div key={item.title} className="sector-card p-3">
                  <div className="text-sm text-[var(--paper)]">{item.title}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
