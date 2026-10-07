cat << 'EOF' > PULL_REQUEST.md
# [Assessment] Milan Rathod - MonthStick fixes

## Summary
- **Duplicate Renewal Prevention**: Added a unique compound index on `(subscriptionId, billingMonth)` in MongoDB to enforce database-level uniqueness. Handled duplicate creation attempts gracefully in the renewal service.
- **Input Validation**: Implemented strict request validation for `month` (YYYY-MM), `page`, `limit` (max 200), and `status` inputs, returning `400 Bad Request` JSON responses instead of unhandled 500 server errors.
- **Query Performance & Filtering**: Refactored the renewal history endpoint to use MongoDB aggregation/population to resolve N+1 query bottlenecks. Added indexing for `billingMonth` and `status` filtering support.
- **Dashboard Race Conditions**: Added `AbortController` cancellation cleanup in React `useEffect` hooks and reset polling intervals on month switches to prevent stale data overlays.
- **Date & Idempotency Fixes**: Standardized all billing month date calculations to UTC to resolve server location discrepancies. Enforced final status immutability for `charged` state on webhook retries.

## Testing
- Commands run: `npm test`
- Manual checks completed:
  - Verified concurrent/duplicate renewal creation requests return newly created vs existing counts without duplicates.
  - Verified invalid input query strings (`?month=invalid`, `?pageSize=999`) return HTTP 400.
  - Verified quick month toggling in dashboard UI cancels stale pending requests and displays correct month summary.

## Assumptions and trade-offs
- Prioritized core database safety, input validation, query optimization, and UI race condition fixes to ensure maximum system reliability within the assessment time limit.

## AI usage
- Tools used: GitHub Copilot / Cursor / Claude
- What AI helped with: Generating initial input validation schemas and helper boilerplate for Banker's rounding calculations.
- How you validated AI-generated suggestions: Verified against existing test suite, inspected code manually for edge cases, and checked local MongoDB index creations.
EOF