# MonthStick — Renewal Console

A full-stack MERN application for managing, generating, and tracking monthly subscription renewal events with database-level concurrency protection, Banker's Rounding financial precision, and an interactive admin dashboard.

---

## Architecture & Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose, Jest, Supertest
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Axios
- **Database**: MongoDB (enforcing compound unique indexes)

---

## Core Engineering Highlights & Business Rules

1. **Duplicate Prevention & Concurrency**:
   - Compound unique index on `(subscriptionId, billingMonth)` and unique `idempotencyKey` enforce uniqueness at the database layer.
   - Batch renewal generation uses `insertMany(documents, { ordered: false })` with MongoDB error code `11000` mapping, tallying duplicate subscriptions as `existingCount` rather than crashing the batch.
2. **Financial Precision (Banker's Rounding)**:
   - Amounts are strictly stored as integer cents to avoid floating-point inaccuracies.
   - GST (18%) is computed per transaction using **Banker's Rounding (half-to-even)** to eliminate statistical rounding bias across large volumes.
3. **UTC Billing Months**:
   - All calendar dates and billing month comparisons use strict UTC (`YYYY-MM`) via `Date.UTC(...)` to prevent server timezone drift.
4. **Status Lifecycle & Immutability**:
   - Transitions: `scheduled` &rarr; `charged` | `failed`; `failed` &rarr; `scheduled` (via Retry).
   - **`charged` status is strictly immutable**: Once paid, charges can never be modified, overwritten, or retried.
5. **Frontend Race-Condition Guards**:
   - `AbortController` integration inside `useRenewals` hook automatically cancels in-flight requests when switching months or status filters rapidly.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017 or configured via `MONGO_URI`)

---

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment (defaults to localhost:27017)
# Copy .env.example if .env does not exist:
# cp .env.example .env

# Seed initial subscriptions (10 sample customer plans)
npm run seed

# Run automated tests (43 unit & integration tests)
npm test

# Start backend server (runs on http://localhost:5000)
npm start
```

---

### 2. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev

# Or test production build
npm run build
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## API Reference

### 1. Generate Monthly Renewals
- **Endpoint**: `POST /api/renewals/generate`
- **Body**: `{ "month": "YYYY-MM" }` *(optional, defaults to current UTC month)*
- **Response (200 OK)**:
  ```json
  {
    "billingMonth": "2026-10",
    "newlyCreated": 8,
    "existingCount": 0
  }
  ```

### 2. Get Renewal History (Paginated)
- **Endpoint**: `GET /api/renewals`
- **Query Params**:
  - `month` (string: `YYYY-MM`, optional)
  - `page` (integer ≥ 1, default `1`)
  - `limit` (integer 1–200, default `20`)
  - `status` (`scheduled` | `charged` | `failed`, optional)
- **Response (200 OK)**:
  ```json
  {
    "billingMonth": "2026-10",
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1,
    "data": [ /* Array of RenewalEvent records with populated subscriptions */ ]
  }
  ```

### 3. Retry Failed Renewal Charge
- **Endpoint**: `POST /api/renewals/:id/retry`
- **Behavior**: Resets status to `scheduled` and clears `failureReason`. Rejects with `400 Bad Request` if event is already `charged`.
- **Response (200 OK)**:
  ```json
  {
    "message": "Renewal charge queued for retry",
    "status": "scheduled",
    "failureReason": null,
    "amountCents": 1999,
    "gstCents": 360
  }
  ```

### 4. Payment Provider Webhook
- **Endpoint**: `POST /api/renewals/:id/webhook`
- **Body**:
  ```json
  {
    "outcome": "charged | failed",
    "failureReason": "Optional failure reason string"
  }
  ```
- **Response (200 OK)**: Updated event document (idempotent; no-op if already `charged`).

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection
│   │   ├── data/            # Seed data (10 subscriptions)
│   │   ├── middleware/      # Express-validator request validation
│   │   ├── models/          # Subscription & RenewalEvent Mongoose schemas
│   │   ├── routes/          # /api/renewals routes
│   │   ├── scripts/         # Database seed script
│   │   ├── services/        # Business logic & renewal service
│   │   └── utils/           # Banker's rounding & UTC billing helpers
│   ├── tests/               # Jest & Supertest integration test suite
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client with error normalisation
│   │   ├── components/      # RenewalTable, GeneratePanel, FilterBar, StatCards, etc.
│   │   ├── hooks/           # useRenewals (with AbortController) & useToast
│   │   ├── utils/           # Currency, date, and month formatters
│   │   ├── App.jsx          # Main application console layout
│   │   └── index.css        # Modern design system tokens & glassmorphism
│   ├── package.json
│   └── vite.config.js       # Vite dev server with /api proxy to port 5000
├── PULL_REQUEST.MD          # Pull request submission notes
└── README.md
```

---

## Testing & Quality Assurance

- **Backend Tests**: 43 automated tests covering validation, duplicate prevention, pagination, Banker's rounding, webhook immutability, and retry flows.
  ```bash
  npm test
  ```
- **Frontend Validation**: Verified production bundle builds cleanly.
  ```bash
  npm run build
  ```
