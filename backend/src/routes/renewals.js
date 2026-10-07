const { Router } = require('express');
const {
  generateRenewals,
  getRenewalHistory,
  processWebhook,
} = require('../services/renewalService');
const {
  validateRenewalHistoryQuery,
  validateGenerateRenewals,
} = require('../middleware/validation');
const { getCurrentBillingMonth } = require('../utils/billingHelpers');

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/renewals/generate
// ---------------------------------------------------------------------------

/**
 * Generates renewal events for all active subscriptions for a given month.
 *
 * Body (optional):
 *   { "month": "YYYY-MM" }   — defaults to current UTC month if omitted.
 *
 * Step 2 — validateGenerateRenewals middleware validates the `month` body
 * field and returns 400 if malformed.
 *
 * Step 1 — generateRenewals() uses insertMany + ordered:false so duplicate
 * entries are counted, not silently swallowed, and only real DB errors throw.
 *
 * Response 200:
 *   {
 *     "billingMonth": "2024-03",
 *     "newlyCreated": 42,
 *     "existingCount": 3
 *   }
 */
router.post('/generate', validateGenerateRenewals, async (req, res, next) => {
  try {
    const billingMonth = req.body.month ?? getCurrentBillingMonth();
    const { newlyCreated, existingCount } = await generateRenewals(billingMonth);

    res.status(200).json({
      billingMonth,
      newlyCreated,
      existingCount,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/renewals
// ---------------------------------------------------------------------------

/**
 * Returns paginated renewal history for a billing month with optional filters.
 *
 * Query params (all optional):
 *   month  — YYYY-MM (defaults to current UTC month)
 *   page   — integer ≥ 1 (default: 1)
 *   limit  — integer 1–200 (default: 20)
 *   status — "scheduled" | "charged" | "failed"
 *
 * Step 2 — validateRenewalHistoryQuery middleware validates all query params
 * and returns 400 with structured JSON on failure before any DB query runs.
 *
 * Response 200:
 *   {
 *     "billingMonth": "2024-03",
 *     "page": 1,
 *     "limit": 20,
 *     "total": 87,
 *     "totalPages": 5,
 *     "data": [ ...RenewalEvent documents with populated subscription... ]
 *   }
 */
router.get('/', validateRenewalHistoryQuery, async (req, res, next) => {
  try {
    const billingMonth = req.query.month ?? getCurrentBillingMonth();
    const page = req.query.page ?? 1;
    const limit = req.query.limit ?? 20;
    const status = req.query.status;

    const result = await getRenewalHistory({ billingMonth, page, limit, status });

    res.status(200).json({
      billingMonth,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/renewals/:id/webhook
// ---------------------------------------------------------------------------

/**
 * Processes a payment provider webhook for a single renewal event.
 *
 * Body:
 *   {
 *     "outcome": "charged" | "failed",
 *     "failureReason": "string (optional, only when outcome is 'failed')"
 *   }
 *
 * Business rule: If the event is already `charged`, this is a no-op (idempotent).
 */
router.post('/:id/webhook', async (req, res, next) => {
  try {
    const { outcome, failureReason } = req.body;

    if (!['charged', 'failed'].includes(outcome)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [
          { field: 'outcome', message: 'outcome must be "charged" or "failed"', value: outcome },
        ],
      });
    }

    const event = await processWebhook(req.params.id, outcome, failureReason);
    res.status(200).json(event);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
