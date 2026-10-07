const mongoose = require('mongoose');

/**
 * RenewalEvent schema — one record per billing cycle attempt.
 *
 * Step 1 (Prevent Duplicate Renewal Events):
 *   A unique compound index on (subscriptionId, billingMonth) is added at
 *   the schema level. This means MongoDB enforces at the database layer that
 *   no two RenewalEvent documents can share the same subscription + month,
 *   even under concurrent writes or retried requests.
 *
 * Status transitions (business rule):
 *   scheduled → charged | failed
 *   failed    → charged | failed
 *   charged   is IMMUTABLE (final state, never overwritten)
 *
 * Financial precision:
 *   amountCents and gstCents are stored as integers (cents).
 *   GST = 18%, rounded with Banker's Rounding (half-to-even).
 */
const renewalEventSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
    },
    /**
     * Billing month in UTC format YYYY-MM.
     * Example: "2024-03" for March 2024.
     * Stored as a string so it is timezone-unambiguous and
     * directly sortable lexicographically.
     */
    billingMonth: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },
    status: {
      type: String,
      enum: ['scheduled', 'charged', 'failed'],
      default: 'scheduled',
    },
    /** Renewal charge amount in integer cents (mirrors Subscription.amountCents) */
    amountCents: {
      type: Number,
      required: true,
      min: 0,
    },
    /**
     * GST amount in integer cents.
     * 18% of amountCents, rounded using Banker's Rounding (half-to-even).
     */
    gstCents: {
      type: Number,
      required: true,
      min: 0,
    },
    /** Idempotency key forwarded to the payment provider to prevent duplicate charges */
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    /** ISO timestamp when the charge was successfully processed */
    chargedAt: {
      type: Date,
      default: null,
    },
    /** Human-readable failure reason, populated only when status === 'failed' */
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

/**
 * STEP 1: Unique compound index on (subscriptionId, billingMonth).
 *
 * Enforces at the database level that only one RenewalEvent can exist per
 * subscription per billing month. Duplicate writes from concurrent HTTP
 * requests, queue retries, or race conditions will result in a MongoDB
 * duplicate-key error (code 11000) rather than silently creating ghost
 * records.
 *
 * The `background: true` option allows the index to be built without
 * blocking normal operations on startup.
 */
renewalEventSchema.index(
  { subscriptionId: 1, billingMonth: 1 },
  { unique: true, background: true, name: 'unique_subscription_billingMonth' }
);

/** Additional index to support fast filtered queries on billingMonth and status */
renewalEventSchema.index({ billingMonth: 1, status: 1 });

module.exports = mongoose.model('RenewalEvent', renewalEventSchema);
