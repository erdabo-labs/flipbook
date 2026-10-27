# Flipbook

A private, single-user Next.js 16 app for tracking acquisitions, inventory, sales, bundles, trades, P&L, and Flippy evaluations. The self-hosted application uses PostgreSQL 18 through `pg`; Supabase and Vercel are no longer runtime dependencies of this branch.

## Architecture

Interactive pages call typed transport functions in `lib/db-client.ts`. Those functions POST to an explicit allowlist at `/api/data/[operation]`. The handler checks the request origin, validates input, and calls server-only `lib/db.ts`. `lib/server/repository.ts` owns parameterized SQL; `lib/server/postgres.ts` owns the lazy pool (maximum 10 connections, connection and statement timeouts). No database connection occurs during import or build. AI routes use the same database layer after request validation. The browser receives records, never credentials, SQL errors, or connection configuration.

All mutations run in a PostgreSQL transaction on one checked-out connection. Deal creation and initial items save together at the final step of the existing two-step form. Sales, trades, splits, bundle changes, undo, deletion, and chat-pair saves are atomic. Sales and trades lock selected items and reject stale selections. Undo rejects a trade if its received items have later transaction history; undo those later transactions first. Bundle allocation reloads trusted costs from PostgreSQL.

Existing view calculations and query ordering are retained, including cash counted once per transaction in metrics and once per acquisition/transaction in `acquisition_pnl`. PostgreSQL retains `NUMERIC(10,2)` money and `NUMERIC(10,4)` AI costs; the driver converts these bounded values to the existing number-based UI contract. IDs are checked for JavaScript safe-integer range. DATE values stay `YYYY-MM-DD`; timestamps stay strings. Fractional-cent inputs are rejected (within a small floating-point arithmetic tolerance), and existing cent allocation keeps its final-item remainder.

## Environment

Use Node.js 22 and npm. Copy `.env.example` to `.env.local` for development, or `.env.production` for the Compose runtime. Never commit populated environment files. Never use `NEXT_PUBLIC_` for database or OpenAI settings.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Runtime PostgreSQL connection URL for `flipbook_app` and database `flipbook`. In Docker use the existing `postgres-main` hostname and its internal PostgreSQL port. URI-encode special characters in credentials. |
| `APP_ORIGIN` | Exact browser origin, e.g. `http://localhost:3000` in development, your private LAN/VPN origin in production. Used for strict origin checks. |
| `OPENAI_API_KEY` | Server-only OpenAI API key for evaluations and chat. |

When using Compose, single-quote the `DATABASE_URL` value in the env file if it contains a literal dollar sign, so Compose does not interpolate it. `DATABASE_URL` and `OPENAI_API_KEY` are read only by server code and must never use a `NEXT_PUBLIC_` prefix. Both environment templates contain only the current server settings; no password or session secret is needed.

## Private network access

Flipbook has no application authentication: anyone who can reach it can use all data and Flippy features. It is a single-user personal application intended only for your home network and UniFi Teleport VPN. There is no login page, password, session cookie, or logout action.

Keep the container private. The existing Compose port mapping defaults to `127.0.0.1`; if selecting another interface, use only an explicitly chosen private interface with LAN/VPN access controls. Keep WAN exposure and public port forwarding disabled. Docker, PostgreSQL, and UniFi infrastructure are unchanged by this authentication removal.

Every data and AI POST still checks `Origin` against `APP_ORIGIN`, requires JSON, and validates inputs. These checks validate requests; network reachability determines access. `/api/health` remains a database-free liveness endpoint. Request bodies are limited to 1 MiB. Raw database/provider errors are neither returned nor logged.

## Development and checks

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
npm start
```

Development needs a separately authorized development database to use data screens. Do not point local development or tests at the existing migrated database without authorization. Tests use injected mock SQL clients/pools and mocked or blocked provider access; they do not read `.env.local`, connect to PostgreSQL, or invoke OpenAI. The build does not need runtime secrets or a database. `next/font/google` currently downloads the existing application fonts during build, requiring outbound network access.

Tests cover credential-free data and AI access, origin rejection on every exposed data operation and both AI routes, request validation, five evaluation kinds, transaction commit/rollback, stale sales, trade undo, split cost conservation, trusted bundle allocation, atomic deal creation, numeric/date conversion, chat persistence, and metrics.

## Deployment preparation (manual; do not run without approval)

The provided Compose file runs **only Flipbook** on the existing external `apps-database` network. It creates no database service, volume, or PostgreSQL port publication. The Dockerfile builds standalone Next.js output using ARM64-compatible Node.js 22 images, runs as non-root, and copies only the runtime output/static assets. `.dockerignore` excludes env files, Git metadata, local dependencies, and private configuration. There are no secret build arguments or secret ENV defaults; inject secrets only when creating the container.

Before deployment, manually verify these items with separately authorized access:

1. The existing `postgres-main` container is reachable on `apps-database`; database `flipbook` and role `flipbook_app` already exist. Confirm connection policy and SSL requirements. Do not disable certificate verification to work around SSL errors.
2. The role has USAGE on the application schema and sequences, SELECT on the three views and underlying tables, and the required INSERT/UPDATE/DELETE privileges. Confirm there are no Supabase-specific RLS policies, triggers, functions, or role dependencies that prevent app operations. This migration does not change any of them.
3. Compare the actual schema to `supabase/schema.sql`, retained as an offline reference. In particular, `evaluation.kind` must permit `listing`, `offer`, `grade`, `grade_deal`, and `sale`. The checked-in constraint has been corrected, but **no SQL has been applied**. Do not run the schema or seed file against the migrated database. Review any required targeted DDL separately.
4. Provide `.env.production` with privately supplied database credentials, OpenAI key, and exact private browser origin. Use filesystem permissions appropriate for secrets. Keep Vercel and Supabase production settings unchanged.
5. Configure a private HTTPS reverse proxy and LAN/VPN reachability separately. Bind the app port to loopback by default, or explicitly select the VM interface reachable by your proxy. Keep it inaccessible from WAN. A reverse proxy in another container needs a reachable host/interface or explicit network configuration; its loopback is not the VM loopback. Preserve the browser Origin header. Set proxy timeouts long enough for AI requests (e.g. 180 seconds).

After approval, on the ARM64 VM from this repository:

```sh
# Optional interface/port interpolation belongs in the shell or a non-secret .env file.
# export APP_BIND_IP=<approved VM interface address>
# export APP_PORT=3000

docker compose build
# Starting the app enables runtime database access; requires explicit approval.
docker compose up -d
docker compose ps
```

On a different build architecture, use buildx with `--platform linux/arm64` and load/tag the image as appropriate. Do not copy macOS `node_modules` into the image. Runtime `.env.production` is excluded from the build context. Avoid `docker compose config` or unrestricted container inspection in shared logs because resolved environment values can include credentials.

For rollback, restore the previous app image/version and recreate only the app container with compatible runtime configuration. No automatic schema migration is performed. Vercel/Supabase remain available independently.

## Remaining integration checks

Mock tests cannot establish live PostgreSQL 18 schema/permission parity or execute SQL against its engine. With separate authorization and a disposable database, run acquisition/item creation, listings/pending bundles, single/bundle sales, cash/no-cash trades, keep/undo, splits, edits, deletion, dashboard/inventory/metrics comparisons, all five Flippy modes, re-evaluation, chat persistence, profile settings, direct access without login, and concurrent/stale sales. Verify a real ARM64 image build, private network binding, VPN access, and AI response latency. No production or migrated database was used to validate this refactor.
