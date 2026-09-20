import { sampleSignalsBySource } from "@/lib/sample-data";
import type { RawSignal, SourceHealth, SourceName, TrackedEntity } from "@/types/osint";

type Connector = {
  source: SourceName;
  label: string;
  scope: "global" | "GB" | "US" | "EU" | "IN" | "NG" | "AU" | "CA";
  roles: Array<"brand" | "competitor">;
  fetchSignals: (entity: TrackedEntity) => Promise<RawSignal[]>;
};

export type LiveConnectorInfo = {
  source: SourceName;
  label: string;
  scope: Connector["scope"];
  roles: Array<"brand" | "competitor">;
};

function buildDiscoveryQuery(entity: TrackedEntity): string {
  if (entity.role === "brand") {
    const tokens = [...entity.services, ...entity.keywords, entity.sector ?? ""].filter(Boolean);
    return tokens.join(" ").trim() || entity.name;
  }
  return [entity.name, ...entity.keywords].join(" ").trim();
}

function normalizeSignal(entity: TrackedEntity, signal: Omit<RawSignal, "id">, suffix: string): RawSignal {
  return {
    ...signal,
    id: `${signal.source}-${entity.id}-${suffix}`,
  };
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function pickPublishedDate(item: string): string {
  const candidates = [
    item.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1],
    item.match(/<published>(.*?)<\/published>/i)?.[1],
    item.match(/<updated>(.*?)<\/updated>/i)?.[1],
    item.match(/<dc:date>(.*?)<\/dc:date>/i)?.[1],
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const time = Date.parse(candidate);
    if (!Number.isNaN(time)) return new Date(time).toISOString();
  }

  return new Date().toISOString();
}

function parseRssItems(
  xml: string,
  entity: TrackedEntity,
  source: SourceName,
  signalType: RawSignal["signalType"],
  sectorFallback: string,
  titleFallback = "Public feed mention",
  limit = 8,
): RawSignal[] {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].slice(0, limit);
  return items.map((match, index) => {
    const item = match[0];
    const title = stripTags(item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? titleFallback);
    const link = decodeEntities(item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "https://example.com");
    const summary = stripTags(
      item.match(/<description>([\s\S]*?)<\/description>/i)?.[1] ?? item.match(/<summary>([\s\S]*?)<\/summary>/i)?.[1] ?? "Public RSS feed mention.",
    );

    return normalizeSignal(
      entity,
      {
        source,
        signalType,
        title,
        summary: summary.slice(0, 260),
        sourceUrl: link,
        publishedAt: pickPublishedDate(item),
        companyName: entity.name,
        location: entity.countries.includes("GB") ? "United Kingdom" : entity.countries[0] ?? "Global",
        sector: entity.sector ?? sectorFallback,
        confidence: 0.66,
        tags: [source, "rss", "public-feed"],
      },
      `${index + 1}`,
    );
  });
}

function synthesizeFallbackSignals(
  entity: TrackedEntity,
  source: SourceName,
  signalType: RawSignal["signalType"],
  label: string,
  sectorFallback: string,
  count = 1,
): RawSignal[] {
  return Array.from({ length: count }, (_, index) =>
    normalizeSignal(
      entity,
      {
        source,
        signalType,
        title: `${label} signal ${index + 1}`,
        summary: `Fallback signal generated while the ${label} feed is unreachable. Review the live source for current public updates.`,
        sourceUrl: "https://github.com/public-apis/public-apis",
        publishedAt: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString(),
        companyName: `${label} lead ${index + 1}`,
        location: entity.countries.includes("GB") ? "United Kingdom" : entity.countries[0] ?? "Global",
        sector: entity.sector ?? sectorFallback,
        confidence: 0.52,
        tags: [source, "fallback"],
      },
      `fallback-${index + 1}`,
    ),
  );
}

async function fetchContractsFinder(entity: TrackedEntity): Promise<RawSignal[]> {
  const keywords = encodeURIComponent(buildDiscoveryQuery(entity));
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

  const what = encodeURIComponent(buildDiscoveryQuery(entity));
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

  const q = encodeURIComponent(buildDiscoveryQuery(entity).split(" ").slice(0, 5).join(" "));
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
  const q = encodeURIComponent(buildDiscoveryQuery(entity));
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

async function fetchGovUkNews(entity: TrackedEntity): Promise<RawSignal[]> {
  const response = await fetch("https://www.gov.uk/search/news-and-communications.atom", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();
  return parseRssItems(xml, entity, "govuk_news_rss", "news", "Policy", "GOV.UK update", 8);
}

async function fetchBbcNews(entity: TrackedEntity): Promise<RawSignal[]> {
  const response = await fetch("https://feeds.bbci.co.uk/news/rss.xml", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();
  return parseRssItems(xml, entity, "bbc_news_rss", "news", "News", "BBC News", 8);
}

async function fetchSpaceflightNews(entity: TrackedEntity): Promise<RawSignal[]> {
  const response = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=8", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as {
    results?: Array<{
      id: number;
      title: string;
      summary?: string;
      url: string;
      published_at: string;
      news_site?: string;
      updated_at?: string;
    }>;
  };

  return (data.results ?? []).map((article, index) =>
    normalizeSignal(
      entity,
      {
        source: "spaceflight_news",
        signalType: "news",
        title: article.title,
        summary: (article.summary ?? "Space industry news signal.").slice(0, 260),
        sourceUrl: article.url,
        publishedAt: article.published_at ?? article.updated_at ?? new Date().toISOString(),
        companyName: article.news_site ?? "Spaceflight News",
        location: "Global",
        sector: entity.sector ?? "Aerospace",
        confidence: 0.7,
        tags: ["news", "space", "industry"],
      },
      `${article.id ?? index + 1}`,
    ),
  );
}

async function fetchFederalRegister(entity: TrackedEntity): Promise<RawSignal[]> {
  const response = await fetch("https://www.federalregister.gov/api/v1/documents.json?per_page=8&order=newest", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as {
    results?: Array<{
      document_number: string;
      title: string;
      abstract?: string;
      html_url: string;
      publication_date?: string;
      agencies?: Array<{ name?: string }>;
    }>;
  };

  return (data.results ?? []).map((doc) =>
    normalizeSignal(
      entity,
      {
        source: "federal_register",
        signalType: "news",
        title: doc.title,
        summary: (doc.abstract ?? "Federal Register notice.").slice(0, 260),
        sourceUrl: doc.html_url,
        publishedAt: doc.publication_date ? new Date(doc.publication_date).toISOString() : new Date().toISOString(),
        companyName: doc.agencies?.[0]?.name ?? "Federal Register",
        location: "United States",
        sector: entity.sector ?? "Public Sector",
        confidence: 0.74,
        tags: ["regulatory", "policy", "notice"],
      },
      doc.document_number,
    ),
  );
}

async function fetchWorldBank(entity: TrackedEntity): Promise<RawSignal[]> {
  const country = entity.countries.includes("GB") ? "GBR" : entity.countries.includes("US") ? "USA" : "GBR";
  const response = await fetch(
    `https://api.worldbank.org/v2/country/${country}/indicator/NY.GDP.MKTP.CD?format=json&per_page=5`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as Array<
    | unknown
    | {
        value?: number;
        date?: string;
        country?: { value?: string };
      }
  >;
  const entries = Array.isArray(data) ? (data[1] as Array<{ value?: number; date?: string; country?: { value?: string } }>) : [];
  const latest = entries.find((item) => item?.value != null) ?? entries[0];
  if (!latest) return [];

  return [
    normalizeSignal(
      entity,
      {
        source: "world_bank",
        signalType: "news",
        title: `World Bank macro data for ${latest.country?.value ?? country}`,
        summary: `Latest GDP series point for ${latest.country?.value ?? country}.`,
        sourceUrl: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392",
        publishedAt: latest.date ? new Date(`${latest.date}-01-01T00:00:00.000Z`).toISOString() : new Date().toISOString(),
        companyName: latest.country?.value ?? "World Bank",
        location: latest.country?.value ?? country,
        sector: entity.sector ?? "Macro",
        confidence: 0.58,
        tags: ["macro", "worldbank", "context"],
      },
      `${country}-${latest.date ?? "latest"}`,
    ),
  ];
}

async function fetchOpenAlex(entity: TrackedEntity): Promise<RawSignal[]> {
  const query = encodeURIComponent(buildDiscoveryQuery(entity));
  const response = await fetch(`https://api.openalex.org/works?search=${query}&per-page=5&sort=publication_date:desc`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as {
    results?: Array<{
      id: string;
      title: string;
      publication_date?: string;
      primary_location?: { source?: { display_name?: string } };
      cited_by_count?: number;
      type?: string;
    }>;
  };

  return (data.results ?? []).map((work) =>
    normalizeSignal(
      entity,
      {
        source: "openalex",
        signalType: "news",
        title: work.title,
        summary: `Research signal${work.cited_by_count != null ? ` with ${work.cited_by_count} citations` : ""}.`,
        sourceUrl: work.id,
        publishedAt: work.publication_date ? new Date(`${work.publication_date}T00:00:00.000Z`).toISOString() : new Date().toISOString(),
        companyName: work.primary_location?.source?.display_name ?? "OpenAlex",
        location: "Global",
        sector: entity.sector ?? "Research",
        confidence: 0.6,
        tags: ["research", "openalex", work.type ?? "work"],
      },
      work.id,
    ),
  );
}

async function fetchBankHolidays(entity: TrackedEntity): Promise<RawSignal[]> {
  const response = await fetch("https://www.gov.uk/bank-holidays.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as {
    [region: string]: { events?: Array<{ title?: string; date?: string }> };
  };
  const firstRegion = Object.values(data)[0];
  const firstEvent = firstRegion?.events?.[0];
  if (!firstEvent) return [];

  return [
    normalizeSignal(
      entity,
      {
        source: "uk_bank_holidays",
        signalType: "planning",
        title: `Upcoming bank holiday: ${firstEvent.title ?? "UK holiday"}`,
        summary: "Public holiday timing signal for outreach scheduling and operational planning.",
        sourceUrl: "https://www.gov.uk/bank-holidays.json",
        publishedAt: firstEvent.date ? new Date(`${firstEvent.date}T00:00:00.000Z`).toISOString() : new Date().toISOString(),
        companyName: "UK Government",
        location: "United Kingdom",
        sector: entity.sector ?? "Planning",
        confidence: 0.55,
        tags: ["calendar", "holiday", "timing"],
      },
      firstEvent.date ?? "next-holiday",
    ),
  ];
}

async function fetchPlanningSignals(entity: TrackedEntity): Promise<RawSignal[]> {
  const fallback = sampleSignalsBySource("planning_portal", 4).map((signal, index) => ({
    ...signal,
    id: `planning-${entity.id}-${index + 1}`,
    tags: [...signal.tags, ...entity.services.slice(0, 2)],
  }));
  return fallback;
}

export const CONNECTOR_REGISTRY: Connector[] = [
  {
    source: "contracts_finder",
    label: "Contracts Finder",
    scope: "GB",
    roles: ["brand", "competitor"],
    fetchSignals: fetchContractsFinder,
  },
  {
    source: "find_a_tender",
    label: "Find a Tender",
    scope: "GB",
    roles: ["brand", "competitor"],
    fetchSignals: async () => [],
  },
  {
    source: "adzuna",
    label: "Adzuna Jobs",
    scope: "GB",
    roles: ["brand", "competitor"],
    fetchSignals: fetchAdzuna,
  },
  {
    source: "companies_house",
    label: "Companies House",
    scope: "GB",
    roles: ["brand", "competitor"],
    fetchSignals: fetchCompaniesHouse,
  },
  {
    source: "planning_portal",
    label: "Planning Signals",
    scope: "GB",
    roles: ["brand", "competitor"],
    fetchSignals: fetchPlanningSignals,
  },
  {
    source: "news_rss",
    label: "News RSS",
    scope: "global",
    roles: ["brand", "competitor"],
    fetchSignals: fetchNewsRss,
  },
  {
    source: "govuk_news_rss",
    label: "GOV.UK News RSS",
    scope: "GB",
    roles: ["brand", "competitor"],
    fetchSignals: fetchGovUkNews,
  },
  {
    source: "bbc_news_rss",
    label: "BBC News RSS",
    scope: "global",
    roles: ["brand", "competitor"],
    fetchSignals: fetchBbcNews,
  },
  {
    source: "spaceflight_news",
    label: "Spaceflight News",
    scope: "global",
    roles: ["brand", "competitor"],
    fetchSignals: fetchSpaceflightNews,
  },
  {
    source: "federal_register",
    label: "Federal Register",
    scope: "US",
    roles: ["brand", "competitor"],
    fetchSignals: fetchFederalRegister,
  },
  {
    source: "world_bank",
    label: "World Bank",
    scope: "global",
    roles: ["brand", "competitor"],
    fetchSignals: fetchWorldBank,
  },
  {
    source: "openalex",
    label: "OpenAlex",
    scope: "global",
    roles: ["brand", "competitor"],
    fetchSignals: fetchOpenAlex,
  },
  {
    source: "uk_bank_holidays",
    label: "UK Bank Holidays",
    scope: "GB",
    roles: ["brand", "competitor"],
    fetchSignals: fetchBankHolidays,
  },
];

export function listLiveConnectors(regions: string[]): LiveConnectorInfo[] {
  const normalized = regions.map((item) => item.toUpperCase());
  return CONNECTOR_REGISTRY.filter(
    (connector) => connector.scope === "global" || normalized.includes(connector.scope),
  ).map((connector) => ({
    source: connector.source,
    label: connector.label,
    scope: connector.scope,
    roles: connector.roles,
  }));
}

export async function collectSignalsForEntity(
  entity: TrackedEntity,
  options?: { activeRegions?: string[] },
): Promise<{
  signals: RawSignal[];
  health: SourceHealth[];
}> {
  const regions = (options?.activeRegions ?? entity.countries).map((item) => item.toUpperCase());
  const eligible = CONNECTOR_REGISTRY.filter(
    (connector) =>
      connector.roles.includes(entity.role) &&
      (connector.scope === "global" || regions.includes(connector.scope)),
  );

  const results = await Promise.all(
    eligible.map(async (connector) => {
      try {
        const records = await connector.fetchSignals(entity);
        if (records.length === 0) {
          const fallback = sampleSignalsBySource(connector.source, 2);
          const signals =
            fallback.length > 0
              ? fallback
              : synthesizeFallbackSignals(entity, connector.source, connector.source === "find_a_tender" ? "tender" : "news", connector.label, entity.sector ?? "General", 2);
          return {
            signals,
            health: {
              source: connector.source,
              status: "fallback" as const,
              message: `No records returned from ${connector.label}; using fallback signals.`,
              records: signals.length,
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
        const sampleFallback = sampleSignalsBySource(connector.source, 3).map((signal, idx) => ({
          ...signal,
          id: `${connector.source}-fallback-${entity.id}-${idx + 1}`,
          companyName: signal.companyName || entity.name,
        }));
        const fallback =
          sampleFallback.length > 0
            ? sampleFallback
            : synthesizeFallbackSignals(entity, connector.source, connector.source === "find_a_tender" ? "tender" : "news", connector.label, entity.sector ?? "General", 3);
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