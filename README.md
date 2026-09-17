# Global Opportunity Radar

Global public-source intelligence for lead generation, market monitoring, and opportunity discovery.

## Product positioning

This project is not a toy OSINT demo. It is a market intelligence and public-source monitoring platform designed to surface high-value business opportunities from open, free, and public data sources.

The platform tracks public activity across regions and industries, then ranks signals by relevance, urgency, and commercial potential. It is designed to help sales teams, agencies, operators, and market researchers find better leads earlier than competitors.

## What the product monitors

- Government procurements and tenders
- Company registration and corporate activity
- Hiring surges and staffing changes
- Funding, expansion, and investment signals
- News and press coverage around target sectors
- Planning, infrastructure, and local development activity
- Sector momentum and macroeconomic signals
- Public company and market intelligence across regions

## Why this is commercially relevant

Most businesses do not have a system that continuously watches public sources for buying intent and opportunity signals. This product fills that gap by turning fragmented public data into a ranked opportunity pipeline.

It is positioned as a business intelligence and lead-generation tool, not a generic surveillance experiment.

## Core value proposition

Discover high-fit business signals earlier. Prioritize them by urgency and commercial value. Turn public-source activity into actionable sales and market opportunities.

## Coverage model

The system is designed to work with a broad, region-aware catalog of public sources, including:

- Government procurement portals
- Tender and contracts databases
- Company registries and enterprise filings
- News and media feeds
- Job market and hiring signals
- Planning and infrastructure data
- Open macroeconomic datasets
- Research and innovation intelligence feeds

## Example free/public sources included in the catalog

- UK Contracts Finder
- Find a Tender Service
- Companies House
- Planning Data UK
- Adzuna
- Google News RSS
- World Bank Open Data
- OpenAlex
- EU TED
- SEC EDGAR
- Nigeria BPP Procurement Portal
- Australia ABN datasets
- Canada open procurement datasets
- National procurement and public data portals across regions

## Typical use cases

- B2B sales prospecting from public signals
- Market monitoring by country or region
- Procurement and tender opportunity tracking
- Hiring-intent and company-growth analysis
- Competitive monitoring and sector expansion signals
- Lead scoring using source evidence and relevance

## Architecture

- Next.js app for the dashboard and APIs
- TypeScript for the product logic
- Prisma ORM for persistence
- SQLite for free local use
- JSON fallback for environments without a database
- Region-aware source catalog for global coverage
- Opportunity scoring engine with evidence-backed results

## Free setup

1. Install dependencies:

```bash
npm install
```

2. Create the environment file:

```bash
copy .env.example .env
```

3. Generate the Prisma client and initialize SQLite:

```bash
npm run db:generate
npm run db:push
```

4. Start the app:

```bash
npm run dev
```

Open http://localhost:3005

## Main routes

- `/` Global opportunity radar
- `/live` Live monitor
- `/settings` Region and signal profile setup

## Notes

- The app is intentionally designed to work without paid APIs.
- Public data and fallback signals keep the prototype useful even without keys.
- Optional keys can be added later for richer live coverage.
- Deployment and scaling can move to hosted Postgres providers later if needed.
