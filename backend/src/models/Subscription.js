const mongoose = require('mongoose');

/**
 * Subscription schema representing a customer subscription.
 * Monthly amount stored in integer cents (e.g. $9.99 => 999).
 */
const subscriptionSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    plan: {
      type: String,
      required: true,
    },
    /** Monthly charge amount in integer cents */
    amountCents: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'paused'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
