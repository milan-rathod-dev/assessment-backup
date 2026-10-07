const RenewalEvent = require('../models/RenewalEvent');
const Subscription = require('../models/Subscription');
const {
  calculateGstCents,
  getCurrentBillingMonth,
  buildIdempotencyKey,
} = require('../utils/billingHelpers');

/**
 * Generates RenewalEvent documents for all active subscriptions for the given month.
 * Uses ordered:false so duplicate-key violations (code 11000) are tallied as existingCount
 * instead of aborting the entire batch.
 */
async function generateRenewals(billingMonth) {
  const month = billingMonth ?? getCurrentBillingMonth();

  const subscriptions = await Subscription.find({ status: 'active' }).lean();
  if (subscriptions.length === 0) {
    return { newlyCreated: 0, existingCount: 0 };
  }

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
    const result = await RenewalEvent.insertMany(documents, { ordered: false });
    newlyCreated = result.length;
  } catch (err) {
    if (err.name === 'MongoBulkWriteError' || err.name === 'BulkWriteError') {
      newlyCreated =
        err.result?.insertedCount ??
        err.result?.nInserted ??
        err.insertedDocs?.length ??
        0;

      // Extract writeErrors, supporting both Mongoose wrapped and native MongoDB driver shapes
      const writeErrors =
        err.writeErrors ??
        (typeof err.result?.getWriteErrors === 'function' ? err.result.getWriteErrors() : []) ??
        [];

      const getCode = (we) => we.code ?? we.err?.code;
      const getErrMsg = (we) => we.errmsg ?? we.err?.errmsg ?? we.message ?? '';

      const unexpectedErrors = writeErrors.filter((we) => getCode(we) !== 11000);
      existingCount = writeErrors.filter((we) => getCode(we) === 11000).length;

      // Fallback if top-level error reported duplicate key
      if (existingCount === 0 && (err.code === 11000 || err.errorResponse?.code === 11000)) {
        existingCount = documents.length - newlyCreated;
      }

      // Re-throw if there were actual database failures unrelated to duplicate keys
      if (unexpectedErrors.length > 0) {
        throw new Error(
          `Bulk write contained ${unexpectedErrors.length} unexpected error(s): ` +
            unexpectedErrors.map(getErrMsg).join('; ')
        );
      }
    } else {
      throw err;
    }
  }

  return { newlyCreated, existingCount };
}

/**
 * Returns paginated renewal events for a billing month, optionally filtered by status.
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

/**
 * Processes a payment provider webhook.
 * Enforces business rule: 'charged' state is final and immutable.
 */
async function processWebhook(renewalEventId, outcome, failureReason) {
  const event = await RenewalEvent.findById(renewalEventId);
  if (!event) {
    const err = new Error(`RenewalEvent ${renewalEventId} not found`);
    err.statusCode = 404;
    throw err;
  }

  // Idempotent: once charged, subsequent callbacks cannot overwrite the record
  if (event.status === 'charged') {
    return event;
  }

  event.status = outcome;
  if (outcome === 'charged') {
    event.chargedAt = new Date();
  } else if (outcome === 'failed') {
    event.failureReason = failureReason ?? 'Unknown failure';
  }

  await event.save();
  return event;
}

/**
 * Retries a failed renewal event by setting status back to 'scheduled'.
 * Rejects if the event is already charged.
 */
async function retryRenewal(renewalEventId) {
  const event = await RenewalEvent.findById(renewalEventId);
  if (!event) {
    const err = new Error(`RenewalEvent ${renewalEventId} not found`);
    err.statusCode = 404;
    throw err;
  }

  if (event.status === 'charged') {
    const err = new Error('Cannot retry a renewal event that is already charged');
    err.statusCode = 400;
    throw err;
  }

  event.status = 'scheduled';
  event.failureReason = null;
  await event.save();

  return RenewalEvent.findById(renewalEventId)
    .populate('subscriptionId', 'customerId plan amountCents')
    .lean();
}

module.exports = {
  generateRenewals,
  getRenewalHistory,
  processWebhook,
  retryRenewal,
};
