# Flipbook

Mobile-first web app for tracking local buy/sell/trade deals (FB Marketplace, KSL, Craigslist, OfferUp, etc). Tracks acquisitions, items within them, and transactions to give a clear picture of P&L per deal and overall.

## Stack

Next.js (App Router) + Supabase + Tailwind CSS, deployed to Vercel.

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor to create tables and views.
3. (Optional) Run `supabase/seed.sql` to load sample dev data.
4. Copy `.env.local.example` to `.env.local` and fill in your Supabase project URL and anon key:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables in the Vercel project settings, then deploy.

## App structure

- `app/page.tsx` — Dashboard with summary stats, active deals, recent activity
- `app/acquisitions` — Deals list, new deal flow, deal detail
- `app/inventory` — Current inventory grouped by acquisition
- `app/transactions/new` — Record a sale, bundle sale, trade, or mark item kept
- `lib/db.ts` — All Supabase data access
- `lib/types.ts` — Types matching the database schema
