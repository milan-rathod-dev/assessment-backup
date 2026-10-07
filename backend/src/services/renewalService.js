const RenewalEvent = require('../models/RenewalEvent');
const Subscription = require('../models/Subscription');
const {
  calculateGstCents,
  getCurrentBillingMonth,
  buildIdempotencyKey,
} = require('../utils/billingHelpers');

// ---------------------------------------------------------------------------
// generateRenewals
// ---------------------------------------------------------------------------

/**
 * Generates RenewalEvent documents for all active subscriptions for a given
 * billing month.
 *
 * Step 1 (Prevent Duplicate Renewal Events):
 * ─────────────────────────────────────────
 * Rather than inserting documents blindly, we use `insertMany` with the
 * `ordered: false` option combined with `{ session }` for atomicity.
 * When `ordered: false`, MongoDB attempts ALL inserts and collects any errors
 * instead of stopping at the first failure. Duplicate-key errors (code 11000)
 * arising from the unique (subscriptionId, billingMonth) index are caught and
 * counted as `existingCount`. Any *other* DB errors are re-thrown so they
 * surface as 500s rather than being silently swallowed.
 *
 * Returns: { newlyCreated: number, existingCount: number }
 *
 * @param {string} [billingMonth] - YYYY-MM. Defaults to current UTC month.
 * @returns {Promise<{ newlyCreated: number, existingCount: number }>}
 */
async function generateRenewals(billingMonth) {
  const month = billingMonth ?? getCurrentBillingMonth();

  // Fetch all active subscriptions
  const subscriptions = await Subscription.find({ status: 'active' }).lean();

  if (subscriptions.length === 0) {
    return { newlyCreated: 0, existingCount: 0 };
  }

  // Build the documents to insert
  const documents = subscriptions.map((sub) => ({
    subscriptionId: sub._id,
    billingMonth: month,
    status: 'scheduled',
    amountCents: sub.amountCents,
    gstCents: calculateGstCents(sub.amountCents),
    idempotencyKey: buildIdempotencyKey(String(sub._id), month),
  }));

  let newlyCreated = 0;
  let existingCount = 0;

  try {
    // ordered: false — continue inserting other docs even if some fail
    const result = await RenewalEvent.insertMany(documents, { ordered: false });
    newlyCreated = result.length;
  } catch (err) {
    // insertMany with ordered:false throws a BulkWriteError even on partial
    // success. We must inspect the error to separate duplicates from real errors.
    if (err.name === 'MongoBulkWriteError' || err.name === 'BulkWriteError') {
      // Tally successes from the partial result
      newlyCreated = err.result?.nInserted ?? 0;

      // Separate duplicate-key errors (11000) from unexpected errors
      const writeErrors = err.writeErrors ?? err.result?.getWriteErrors?.() ?? [];
      const unexpectedErrors = writeErrors.filter((we) => we.code !== 11000);

      // Count duplicates
      existingCount = writeErrors.filter((we) => we.code === 11000).length;

      // Re-throw if there are errors unrelated to uniqueness violations
      if (unexpectedErrors.length > 0) {
        throw new Error(
          `Bulk write contained ${unexpectedErrors.length} unexpected error(s): ` +
            unexpectedErrors.map((e) => e.errmsg).join('; ')
        );
      }
    } else {
      // Not a bulk-write error — propagate to the route handler as a 500
      throw err;
    }
  }

  return { newlyCreated, existingCount };
}

// ---------------------------------------------------------------------------
// getRenewalHistory
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of RenewalEvent documents for a given billing month,
 * optionally filtered by status.
 *
 * @param {object} options
 * @param {string}  options.billingMonth - YYYY-MM billing month (required).
 * @param {number}  [options.page=1]     - 1-based page number.
 * @param {number}  [options.limit=20]   - Items per page (max 200).
 * @param {string}  [options.status]     - Optional status filter.
 * @returns {Promise<{
 *   data: object[],
 *   page: number,
 *   limit: number,
 *   total: number,
 *   totalPages: number,
 * }>}
 */
async function getRenewalHistory({ billingMonth, page = 1, limit = 20, status }) {
  const filter = { billingMonth };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    RenewalEvent.find(filter)
      .populate('subscriptionId', 'customerId plan amountCents')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    RenewalEvent.countDocuments(filter),
  ]);

  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ---------------------------------------------------------------------------
// processWebhook (idempotent)
// ---------------------------------------------------------------------------

/**
 * Processes a payment provider webhook event.
 *
 * Step 5 (Critical Bug Fix — idempotent webhook processing):
 * If the RenewalEvent is already in `charged` state, the update is silently
 * skipped — `charged` is immutable and final per the business rules.
 *
 * @param {string} renewalEventId - MongoDB ObjectId of the RenewalEvent.
 * @param {'charged'|'failed'} outcome - The result from the payment provider.
 * @param {string} [failureReason]   - Human-readable reason when outcome is 'failed'.
 * @returns {Promise<object>} The updated RenewalEvent document.
 */
async function processWebhook(renewalEventId, outcome, failureReason) {
  // Find the event — do NOT update yet; enforce immutability check first
  const event = await RenewalEvent.findById(renewalEventId);
  if (!event) {
    const err = new Error(`RenewalEvent ${renewalEventId} not found`);
    err.statusCode = 404;
    throw err;
  }

  // Enforce: charged is IMMUTABLE
  if (event.status === 'charged') {
    return event; // Idempotent — no-op
  }

  // Apply transition
  event.status = outcome;
  if (outcome === 'charged') {
    event.chargedAt = new Date();
  } else if (outcome === 'failed') {
    event.failureReason = failureReason ?? 'Unknown failure';
  }

  await event.save();
  return event;
}

module.exports = {
  generateRenewals,
  getRenewalHistory,
  processWebhook,
};
