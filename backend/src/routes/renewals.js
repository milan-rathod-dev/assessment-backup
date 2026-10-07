const { Router } = require('express');
const {
  generateRenewals,
  getRenewalHistory,
  processWebhook,
  retryRenewal,
} = require('../services/renewalService');
const {
  validateRenewalHistoryQuery,
  validateGenerateRenewals,
  validateRetryRenewal,
} = require('../middleware/validation');
const { getCurrentBillingMonth } = require('../utils/billingHelpers');

const router = Router();

// POST /api/renewals/generate
// Generates renewal events for all active subscriptions for the given billing month.
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

// GET /api/renewals
// Returns paginated renewal history for a billing month with optional status filter.
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

// POST /api/renewals/:id/webhook
// Payment provider webhook callback. Idempotent: 'charged' records are immutable.
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

// POST /api/renewals/:id/retry
// Resets a failed renewal back to 'scheduled'. Rejects if already charged.
router.post('/:id/retry', validateRetryRenewal, async (req, res, next) => {
  try {
    const event = await retryRenewal(req.params.id);
    res.status(200).json({
      message: 'Renewal charge queued for retry',
      data: event,
      ...event,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
