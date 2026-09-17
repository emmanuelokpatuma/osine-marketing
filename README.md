# OSINT Marketing Opportunity Radar

Location-driven OSINT app for finding leads and interested prospects from public data.

## Features

- Live opportunity feed from free/public sources
- Region selector that maps to source coverage
- Prospect scoring with explainable evidence links
- API source health and fallback handling
- Free-first storage: Prisma + SQLite locally, with JSON fallback if DB is unavailable

## Free Setup (No Money Required)

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
copy .env.example .env.local
```

3. Generate Prisma client and create local SQLite schema:

```bash
npm run db:generate
npm run db:push
```

4. Optional seed for file fallback mode:

```bash
npm run db:seed
```

5. Start app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Optional: Free Hosted Postgres Later

You can switch `DATABASE_URL` to Neon or Supabase when ready.

- Neon: free serverless Postgres
- Supabase: free Postgres + dashboard

When you switch, run:

```bash
npm run db:push
```

## Main Routes

- `/` Global opportunity radar
- `/live` Auto-refresh live monitoring
- `/settings` Region, profile, and free API coverage setup

## Notes

- If DB is down or not configured, app falls back to JSON files in `data/`.
- Add API keys in `.env.local` for higher-quality live coverage:
	- `ADZUNA_APP_ID`
	- `ADZUNA_APP_KEY`
	- `COMPANIES_HOUSE_API_KEY`
