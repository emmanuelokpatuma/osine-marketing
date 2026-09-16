import type { RawSignal, SourceName } from "@/types/osint";

type SeedInput = Omit<RawSignal, "id" | "publishedAt"> & {
  publishedAtOffsetHours: number;
};

const now = Date.now();

const seed: SeedInput[] = [
  {
    source: "adzuna",
    signalType: "hiring",
    title: "Senior AWS Platform Engineer",
    summary:
      "Financial services company hiring multiple platform engineers with Kubernetes and Terraform.",
    sourceUrl: "https://www.adzuna.co.uk/jobs/details/example-aws-platform",
    companyName: "NorthBridge Financial",
    location: "Manchester, UK",
    sector: "Financial Services",
    confidence: 0.88,
    tags: ["aws", "kubernetes", "terraform", "platform engineering"],
    publishedAtOffsetHours: 5,
  },
  {
    source: "contracts_finder",
    signalType: "tender",
    title: "Cloud migration and managed platform services",
    summary:
      "Public sector procurement for cloud migration support, DevOps enablement, and platform reliability.",
    sourceUrl: "https://www.contractsfinder.service.gov.uk/Notice/example-cloud-migration",
    companyName: "Leeds City Digital Office",
    location: "Leeds, UK",
    sector: "Public Sector",
    confidence: 0.92,
    tags: ["cloud migration", "devops", "platform", "aws"],
    publishedAtOffsetHours: 9,
  },
  {
    source: "news_rss",
    signalType: "news",
    title: "Retail chain announces nationwide e-commerce replatform",
    summary:
      "Announcement indicates migration to cloud-native architecture and modernization of checkout systems.",
    sourceUrl: "https://news.google.com/rss/articles/example-retail-replatform",
    companyName: "Harbor Retail Group",
    location: "Birmingham, UK",
    sector: "Retail",
    confidence: 0.75,
    tags: ["replatform", "cloud", "modernization", "checkout"],
    publishedAtOffsetHours: 14,
  },
  {
    source: "companies_house",
    signalType: "company_change",
    title: "New incorporation in cybersecurity consulting",
    summary:
      "Newly incorporated firm focused on regulated cloud security and compliance services.",
    sourceUrl:
      "https://find-and-update.company-information.service.gov.uk/company/example-cyber",
    companyName: "RegShield Cloud Security Ltd",
    location: "London, UK",
    sector: "Cybersecurity",
    confidence: 0.7,
    tags: ["cybersecurity", "cloud security", "compliance"],
    publishedAtOffsetHours: 31,
  },
  {
    source: "adzuna",
    signalType: "hiring",
    title: "DevSecOps Engineer",
    summary:
      "Scale-up hiring DevSecOps engineers with EKS, CI/CD hardening, and IAM governance experience.",
    sourceUrl: "https://www.adzuna.co.uk/jobs/details/example-devsecops",
    companyName: "PulsePay UK",
    location: "London, UK",
    sector: "Fintech",
    confidence: 0.86,
    tags: ["devsecops", "eks", "iam", "cicd"],
    publishedAtOffsetHours: 2,
  },
  {
    source: "contracts_finder",
    signalType: "tender",
    title: "Security operations center tooling refresh",
    summary:
      "Buyer seeks partner for SOC modernization, SIEM integration, and incident response automation.",
    sourceUrl: "https://www.contractsfinder.service.gov.uk/Notice/example-soc-refresh",
    companyName: "Southshire NHS Trust",
    location: "Bristol, UK",
    sector: "Healthcare",
    confidence: 0.9,
    tags: ["soc", "siem", "security", "automation"],
    publishedAtOffsetHours: 20,
  },
];

export function sampleSignalsBySource(source: SourceName, limit = 25): RawSignal[] {
  return seed
    .filter((item) => item.source === source)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      id: `${source}-sample-${index + 1}`,
      publishedAt: new Date(now - item.publishedAtOffsetHours * 60 * 60 * 1000).toISOString(),
    }));
}