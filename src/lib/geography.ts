import type { Opportunity } from "@/types/osint";

const COUNTRY_RULES: Array<{ label: string; terms: string[] }> = [
  { label: "United Kingdom", terms: ["united kingdom", "uk", "great britain", "england", "scotland", "wales", "northern ireland"] },
  { label: "United States", terms: ["united states", "usa", "us", "america"] },
  { label: "Ireland", terms: ["ireland", "republic of ireland"] },
  { label: "European Union", terms: ["european union", "eu"] },
  { label: "Europe", terms: ["europe"] },
  { label: "Global", terms: ["global"] },
];

export function countryLabelFromLocation(location: string): string {
  const normalized = location.toLowerCase();

  for (const rule of COUNTRY_RULES) {
    if (rule.terms.some((term) => normalized.includes(term))) {
      return rule.label;
    }
  }

  const parts = location
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts[parts.length - 1];
  }

  return location.trim() || "Global";
}

export function locationMatchesCountry(location: string, selectedCountry: string): boolean {
  if (!selectedCountry || selectedCountry === "All countries") return true;
  const normalizedCountry = selectedCountry.toLowerCase();
  const normalizedLocation = location.toLowerCase();

  return COUNTRY_RULES.some(
    (rule) => rule.label.toLowerCase() === normalizedCountry && rule.terms.some((term) => normalizedLocation.includes(term)),
  ) || normalizedLocation.includes(normalizedCountry);
}

export function countryOptionsFromOpportunities(opportunities: Opportunity[]): string[] {
  return [...new Set(opportunities.map((opportunity) => countryLabelFromLocation(opportunity.location)))].sort((a, b) => a.localeCompare(b));
}
