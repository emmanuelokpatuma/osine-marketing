import type { Opportunity } from "@/types/osint";

function sourceLabel(source: string): string {
  switch (source) {
    case "contracts_finder":
      return "Contracts Finder";
    case "find_a_tender":
      return "Find a Tender";
    case "adzuna":
      return "Adzuna";
    case "companies_house":
      return "Companies House";
    case "news_rss":
      return "News RSS";
    default:
      return source;
  }
}

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <article className="rounded-2xl border border-[var(--color-rule)] bg-white/85 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg leading-tight">{opportunity.companyName}</h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {opportunity.sector} · {opportunity.location}
          </p>
        </div>
        <div className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--color-accent)]">
          Score {opportunity.score}
        </div>
      </div>

      <div className="mt-3 text-sm text-[var(--color-muted)]">
        Confidence {(opportunity.confidence * 100).toFixed(0)}%
      </div>

      <ul className="mt-4 space-y-1 text-sm">
        {opportunity.reasons.map((reason) => (
          <li key={reason}>- {reason}</li>
        ))}
      </ul>

      <p className="mt-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-panel)] p-3 text-sm">
        <span className="font-medium">Recommended move:</span> {opportunity.recommendedAction}
      </p>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]">Evidence</p>
        <div className="mt-2 space-y-2">
          {opportunity.evidence.slice(0, 4).map((item) => (
            <a
              className="block rounded-lg border border-[var(--color-rule)] px-3 py-2 text-sm hover:bg-[var(--color-panel)]"
              key={`${item.url}-${item.publishedAt}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              <div className="font-medium">{item.title}</div>
              <div className="mt-1 text-xs text-[var(--color-muted)]">
                {sourceLabel(item.source)} · {new Date(item.publishedAt).toLocaleDateString()}
              </div>
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}
