export type SignalType =
  | "tender"
  | "hiring"
  | "company_change"
  | "news"
  | "planning";

export type SourceName =
  | "contracts_finder"
  | "find_a_tender"
  | "adzuna"
  | "companies_house"
  | "news_rss";

export type OpportunityProfile = {
  audience: string;
  geography: string;
  services: string[];
  sectors: string[];
};

export type EntityRole = "brand" | "competitor";

export type TrackedEntity = {
  id: string;
  name: string;
  role: EntityRole;
  keywords: string[];
  countries: string[];
  services: string[];
  sector?: string;
};

export type Workspace = {
  brand: TrackedEntity | null;
  competitors: TrackedEntity[];
};

export type RawSignal = {
  id: string;
  source: SourceName;
  signalType: SignalType;
  title: string;
  summary: string;
  sourceUrl: string;
  publishedAt: string;
  companyName: string;
  location: string;
  sector: string;
  confidence: number;
  tags: string[];
};

export type Opportunity = {
  companyName: string;
  location: string;
  sector: string;
  score: number;
  confidence: number;
  matchedServices: string[];
  reasons: string[];
  evidence: Array<{
    source: SourceName;
    signalType: SignalType;
    title: string;
    url: string;
    publishedAt: string;
  }>;
  recommendedAction: string;
  lastUpdatedAt: string;
};

export type SourceHealth = {
  source: SourceName;
  status: "ok" | "fallback" | "error";
  message: string;
  records: number;
};

export type PipelineResult = {
  generatedAt: string;
  profile: OpportunityProfile;
  signals: RawSignal[];
  opportunities: Opportunity[];
  sourceHealth: SourceHealth[];
};