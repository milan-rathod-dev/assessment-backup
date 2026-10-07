const mongoose = require('mongoose');

const renewalEventSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
    },
    // Billing month in UTC format YYYY-MM (e.g. "2026-10")
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
    amountCents: {
      type: Number,
      required: true,
      min: 0,
    },
    gstCents: {
      type: Number,
      required: true,
      min: 0,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    chargedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce single renewal per subscription per billing month
renewalEventSchema.index(
  { subscriptionId: 1, billingMonth: 1 },
  { unique: true, background: true, name: 'unique_subscription_billingMonth' }
);

renewalEventSchema.index({ billingMonth: 1, status: 1 });

module.exports = mongoose.model('RenewalEvent', renewalEventSchema);
