# [Assessment] Milan Rathod - MonthStick fixes

## Summary
- **Duplicate Renewal Prevention**: Added a unique compound index on `(subscriptionId, billingMonth)` in MongoDB to enforce database-level uniqueness. Handled duplicate creation attempts gracefully in the renewal service with `ordered: false` and error code `11000` mapping.
- **Input Validation**: Implemented strict request validation for `month` (YYYY-MM), `page` (≥ 1), `limit` (max 200), and `status` inputs, returning `400 Bad Request` JSON responses with structured field errors instead of unhandled 500 server errors.
- **Query Performance & Filtering**: Refactored the renewal history endpoint to use MongoDB population and compound indexing on `(billingMonth, status)` to resolve N+1 query bottlenecks.
- **Retry Failed Charges**: Added `POST /api/renewals/:id/retry` allowing administrators to retry failed renewal charges directly from the dashboard, resetting status to `scheduled` while enforcing that already `charged` events are immutable.
- **Dashboard Race Conditions**: Added `AbortController` cancellation cleanup in React `useEffect` hooks when switching months or status filters to prevent stale data overlays.
- **Date & Idempotency Fixes**: Standardized all billing month date calculations to UTC to resolve server location discrepancies. Enforced final status immutability for `charged` state on webhook callbacks.
- **React Frontend Console**: Built a responsive, modern Renewal Console dashboard with month selection, duplicate-safe generation trigger, status filters, summary cards, and interactive retry and simulation actions.

## Testing
- Commands run:
  - `npm test` in backend: **43 passed, 43 total** across 2 test suites.
  - `npm run build` in frontend: Vite production bundle compiled cleanly with 0 errors.
- Manual checks completed:
  - Verified first-time generation creates active renewal records, and clicking again returns `{ newlyCreated: 0, existingCount: 8 }` without error.
  - Verified invalid input query strings (`?month=invalid`, `?limit=201`, `?page=0`) return HTTP 400 with structured JSON details.
  - Verified full renewal lifecycle: generated renewals, simulated provider failure, retried failed charges from the dashboard, and charged successfully.
  - Verified that already charged renewal events cannot be retried (HTTP 400 immutable guard).
  - Verified quick month toggling cancels in-flight requests via `AbortController`.

## Assumptions and trade-offs
- Prioritized database integrity, strict input validation, query optimization, retry lifecycle, and race condition prevention.
- Handled financial amounts strictly in integer cents with Banker's Rounding (half-to-even) for 18% GST to avoid cumulative fractional cent drift.

## AI usage
- Tools used: GitHub Copilot / Cursor / Claude / Antigravity
- What AI helped with: Generating input validation schemas, boilerplate for Banker's rounding calculations, and React dashboard component scaffolding.
- How you validated AI-generated suggestions: Verified against automated Jest test suite (43 unit/integration tests), inspected code manually for edge cases, and checked local MongoDB index creations and browser network interactions.