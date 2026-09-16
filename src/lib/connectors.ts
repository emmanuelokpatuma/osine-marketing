import { sampleSignalsBySource } from "@/lib/sample-data";
import type { RawSignal, SourceHealth, SourceName, TrackedEntity } from "@/types/osint";

type Connector = {
  source: SourceName;
  label: string;
  scope: "global" | "GB";
  fetchSignals: (entity: TrackedEntity) => Promise<RawSignal[]>;
};

function normalizeSignal(entity: TrackedEntity, signal: Omit<RawSignal, "id">, suffix: string): RawSignal {
  return {
    ...signal,
    id: `${signal.source}-${entity.id}-${suffix}`,
  };
}

async function fetchContractsFinder(entity: TrackedEntity): Promise<RawSignal[]> {
  const keywords = encodeURIComponent([entity.name, ...entity.keywords].join(" "));
  const url = `https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?keyword=${keywords}&order=desc&size=8`;
  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = (await response.json()) as {
    results?: Array<{
      notice: {
        id: string;
        title: string;
        description: string;
        publishedDate: string;
        organisationName: string;
      };
    }>;
  };

  return (data.results ?? []).map(({ notice }) =>
    normalizeSignal(
      entity,
      {
        source: "contracts_finder",
        signalType: "tender",
        title: notice.title,
        summary: `${notice.organisationName} - ${notice.description}`.slice(0, 260),
        sourceUrl: `https://www.contractsfinder.service.gov.uk/Notice/${notice.id}`,
        publishedAt: notice.publishedDate,
        companyName: notice.organisationName,
        location: entity.countries.includes("GB") ? "United Kingdom" : "Unknown",
        sector: entity.sector ?? "Public Sector",
        confidence: 0.9,
        tags: ["tender", "procurement"],
      },
      notice.id,
    ),
  );
}

async function fetchAdzuna(entity: TrackedEntity): Promise<RawSignal[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("Missing ADZUNA_APP_ID / ADZUNA_APP_KEY");
  }

  const what = encodeURIComponent([entity.name, ...entity.keywords].join(" "));
  const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=${what}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      id: string;
      title: string;
      description: string;
      redirect_url: string;
      created: string;
      company?: { display_name?: string };
      location?: { display_name?: string };
      category?: { label?: string };
    }>;
  };

  return (data.results ?? []).map((job) =>
    normalizeSignal(
      entity,
      {
        source: "adzuna",
        signalType: "hiring",
        title: job.title,
        summary: (job.description ?? "").slice(0, 260),
        sourceUrl: job.redirect_url,
        publishedAt: new Date(job.created).toISOString(),
        companyName: job.company?.display_name ?? entity.name,
        location: job.location?.display_name ?? "United Kingdom",
        sector: job.category?.label ?? entity.sector ?? "Technology",
        confidence: 0.85,
        tags: ["hiring", "buying signal"],
      },
      job.id,
    ),
  );
}

async function fetchCompaniesHouse(entity: TrackedEntity): Promise<RawSignal[]> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing COMPANIES_HOUSE_API_KEY");
  }

  const q = encodeURIComponent(entity.name);
  const url = `https://api.company-information.service.gov.uk/search/companies?q=${q}&items_per_page=5`;
  const auth = Buffer.from(`${apiKey}:`).toString("base64");
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    items?: Array<{
      company_number: string;
      title: string;
      company_status?: string;
      date_of_creation?: string;
      address_snippet?: string;
      snippet?: string;
    }>;
  };

  return (data.items ?? []).map((item) =>
    normalizeSignal(
      entity,
      {
        source: "companies_house",
        signalType: "company_change",
        title: `${item.title} (${item.company_status ?? "status unknown"})`,
        summary: (item.snippet ?? item.address_snippet ?? "Companies House record update").slice(0, 260),
        sourceUrl: `https://find-and-update.company-information.service.gov.uk/company/${item.company_number}`,
        publishedAt: item.date_of_creation
          ? new Date(`${item.date_of_creation}T00:00:00.000Z`).toISOString()
          : new Date().toISOString(),
        companyName: item.title,
        location: item.address_snippet ?? "United Kingdom",
        sector: entity.sector ?? "Business",
        confidence: 0.72,
        tags: ["company", "registry", "uk"],
      },
      item.company_number,
    ),
  );
}

async function fetchNewsRss(entity: TrackedEntity): Promise<RawSignal[]> {
  const q = encodeURIComponent(entity.name);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-GB&gl=GB&ceid=GB:en`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const xml = await response.text();
  const items = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].slice(0, 8);

  return items.map((match, index) => {
    const item = match[0];
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? "News mention";
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "https://news.google.com/";
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
    return normalizeSignal(
      entity,
      {
        source: "news_rss",
        signalType: "news",
        title,
        summary: "News source mention relevant to tracked company and services.",
        sourceUrl: link,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        companyName: entity.name,
        location: "United Kingdom",
        sector: entity.sector ?? "Business",
        confidence: 0.68,
        tags: ["news", "market"],
      },
      String(index + 1),
    );
  });
}

export const CONNECTOR_REGISTRY: Connector[] = [
  { source: "contracts_finder", label: "Contracts Finder", scope: "GB", fetchSignals: fetchContractsFinder },
  { source: "find_a_tender", label: "Find a Tender", scope: "GB", fetchSignals: async () => [] },
  { source: "adzuna", label: "Adzuna Jobs", scope: "GB", fetchSignals: fetchAdzuna },
  { source: "companies_house", label: "Companies House", scope: "GB", fetchSignals: fetchCompaniesHouse },
  { source: "news_rss", label: "News RSS", scope: "global", fetchSignals: fetchNewsRss },
];

export async function collectSignalsForEntity(entity: TrackedEntity): Promise<{
  signals: RawSignal[];
  health: SourceHealth[];
}> {
  const eligible = CONNECTOR_REGISTRY.filter(
    (connector) => connector.scope === "global" || entity.countries.includes(connector.scope),
  );

  const results = await Promise.all(
    eligible.map(async (connector) => {
      try {
        const records = await connector.fetchSignals(entity);
        if (records.length === 0 && connector.source === "find_a_tender") {
          const fallback = sampleSignalsBySource(connector.source, 2);
          return {
            signals: fallback,
            health: {
              source: connector.source,
              status: "fallback" as const,
              message: "Using curated fallback while connector endpoint is pending.",
              records: fallback.length,
            },
          };
        }
        return {
          signals: records,
          health: {
            source: connector.source,
            status: "ok" as const,
            message: `Fetched from ${connector.label}.`,
            records: records.length,
          },
        };
      } catch (error) {
        const fallback = sampleSignalsBySource(connector.source, 3).map((signal, idx) => ({
          ...signal,
          id: `${connector.source}-fallback-${entity.id}-${idx + 1}`,
          companyName: signal.companyName || entity.name,
        }));
        return {
          signals: fallback,
          health: {
            source: connector.source,
            status: "fallback" as const,
            message: `Fallback in use: ${error instanceof Error ? error.message : "unknown error"}`,
            records: fallback.length,
          },
        };
      }
    }),
  );

  return {
    signals: results.flatMap((item) => item.signals),
    health: results.map((item) => item.health),
  };
}