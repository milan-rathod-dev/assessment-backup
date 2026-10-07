cat << 'EOF' > PROMPT.md
# AI Developer Instructions: MonthStick Technical Assessment

## Overview
You are acting as a Senior MERN Stack Developer working on the "MonthStick Renewal Console" codebase. Your goal is to fix critical production bugs, prevent race conditions, enforce database integrity, improve query performance, and ensure strict compliance with business rules.

---

## Fixed Business Rules
1. **UTC Dates & Billing Month**: All date and month calculations must be in UTC (`YYYY-MM`).
2. **Financial Precision & Banker's Rounding**: Money is stored in integer cents. GST is 18%, calculated per renewal event and rounded to the nearest cent using **Banker's Rounding** (half-to-even rounding).
3. **Status Transitions**: `scheduled` → `charged` or `failed`; `failed` → `charged` or `failed`. `charged` is immutable and final.
4. **Concurrency & Idempotency**: Payment provider requests must be throttled to a maximum of **4 concurrent requests**. Attach idempotency keys to prevent duplicate charges.
5. **Pagination**: 1-based indexing (`page=1` is the first page).
6. **Seed Data Integrity**: Never edit the seed data file.

---

## Priority Implementation Plan

### Step 1: Prevent Duplicate Renewal Events
- Add unique compound index on `(subscriptionId, billingMonth)` in Mongoose `RenewalEvent` schema.
- Handle bulk/upsert operations safely without swallowing DB errors.
- Return response summarizing `{ newlyCreated, existingCount }`.

### Step 2: Validate Request Input
- Validate `month` (YYYY-MM), `page` (≥ 1), `limit` (1–200), `status` filter (`scheduled`, `charged`, `failed`).
- Return HTTP `400 Bad Request` with structured JSON on error.

### Step 3: Optimize Renewal-History API & Status Filter
- Replace looping queries with MongoDB aggregation (`$lookup`) or `.populate()`.
- Add `status` query filter and update total counts/pagination accordingly.

### Step 4: Fix Frontend Race Conditions (React)
- Implement `AbortController` in `useEffect` hooks when switching months.
- Clear polling timers on month transitions.
- Add "Status" filter dropdown and reset pagination to page 1 on filter changes.

### Step 5: Critical Bug Fixes
- Standardize month date calculations to `Date.UTC(...)`.
- Enforce idempotent webhook/retry processing (ignore events already `charged`).
EOF