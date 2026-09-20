"use client";

import { useMemo, useState } from "react";

type LeadGeneratorResponse = {
  generatedAt: string;
  prompt: string;
  country: string;
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
  const [prompt, setPrompt] = useState(
    "Find the strongest opportunities for buyers ready to move now. Group the results by the selected country and explain what each lead needs.",
  );
  const [country, setCountry] = useState(defaultCountry);
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
        body: JSON.stringify({ prompt, country }),
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
          <h2 className="mt-3 text-[34px] leading-[1.15] md:text-[38px]">Tell Gemini what you want, then generate the full lead set</h2>
          <p className="mt-3 max-w-[70ch] text-sm text-[var(--muted)]">
            Describe the buyer, sector, urgency, or use case. The generator returns every matching opportunity in the selected country, the filtered leads, and a Gemini brief you can use immediately.
          </p>
        </div>
        <button onClick={generate} className="instrument-button instrument-button-primary" disabled={loading}>
          {loading ? "Generating..." : "Generate leads"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="premium-panel p-5">
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
              <span className="text-[var(--paper)]">Example:</span> “Show me the most motivated public sector buyers in the UK and draft a compliant outreach plan.”
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
