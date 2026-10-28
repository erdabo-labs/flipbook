# Duo adaptive layout trial

Branch: `codex/duo-adaptive-layout`.

This trial changes the browser UI and static PWA assets. The data transport contract, API handlers, SQL, PostgreSQL configuration, and deployment are unchanged.

## Behavior

- At 780 CSS pixels and above, deal/evaluation details show a persistent collection list beside independently scrolling detail content. Below that width the same URL shows only the detail. Resizing does not navigate or replace the detail component.
- Inventory selection uses `/inventory?item=<id>`. Compact layouts show the inspector; expanded layouts show inventory beside it. The inspector exposes the existing item actions and sale workflow.
- Deal and transaction forms show live summaries on wider screens. Their existing save operations and two-step acquisition flow remain intact.
- Bottom navigation remains available on wider screens, with a bounded control row. Tabs remember the last detail visited in this tab; tapping the active tab returns to its collection.
- A shared navigation clearance includes the full 86px bar and bottom safe-area inset. All four screen edges have safe-area handling. Sheets have dynamic viewport height limits, scrolling, Escape dismissal, focus trapping/restoration, and background scroll locking.
- New deal, transaction, and evaluation drafts, the deal filter, and unsent chat text use versioned session storage. Successful saves clear their draft. Forms offer an explicit discard action. Data stays within this browser tab/session; it is not a cross-device draft system. Browser storage failure falls back to memory. Resizing preserves in-memory edits and requests.
- The manifest enables standalone installation without orientation locking. A production-only service worker caches a generic offline page, not routes, API responses, records, mutations, or AI output. There is no offline submission queue. Existing open forms can retain drafts; a cold offline launch cannot load data screens.

## Verification

`npm test`, `npm run lint`, and `npx tsc --noEmit` run without PostgreSQL or OpenAI access. The production build also runs without runtime credentials. In the implementation environment Turbopack failed to bind a CSS-processing port; `npx next build --webpack` completed successfully.

The optional `scripts/duo-smoke.mjs` browser test requires Playwright and its Chromium browser to be installed outside the app dependency tree. Set `FLIPBOOK_PLAYWRIGHT_MODULE` to the Playwright module path when needed. It defaults to a local preview at `http://127.0.0.1:3100`; override with `FLIPBOOK_TEST_ORIGIN`. Run only against a local preview with blank database/provider credentials. The script intercepts all API requests with fixtures and verifies no mutations occur. It checks draft reload/discard, resizing, selected detail URLs, Stock inspection, sheet keyboard focus, and horizontal overflow. It disables service workers; worker policy has separate unit tests.

## Device review still needed

Test Safari and installed standalone mode with the outer display, inner display in both orientations, side-by-side windows, larger text, and the keyboard open. Check every edge inset, bottom controls, sheet scrolling, Back/Forward, deal step two, a pending AI request, VPN loss/reconnection, and PWA worker installation/offline fallback. Chromium viewport tests cannot establish Safari keyboard or physical fold behavior.

This version uses available width and does not require experimental posture/segment APIs. Fold-specific enhancements, a sidebar navigation rail, richer route animations, and native WidgetKit extensions remain follow-up work. Native widgets require a separate iOS companion and investigation of compatibility with the existing private, origin-checked API.
