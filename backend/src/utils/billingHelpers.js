const GST_RATE = 0.18;

/**
 * Banker's Rounding (half-to-even) to eliminate rounding bias over financial transactions.
 * Rounds ties (.5) to the nearest even integer.
 */
function bankersRound(value) {
  const floor = Math.floor(value);
  const fraction = value - floor;

  if (fraction < 0.5) return floor;
  if (fraction > 0.5) return floor + 1;

  return floor % 2 === 0 ? floor : floor + 1;
}

/**
 * Calculates 18% GST in integer cents using Banker's Rounding.
 */
function calculateGstCents(amountCents) {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error(`amountCents must be a non-negative integer, received: ${amountCents}`);
  }
  return bankersRound(amountCents * GST_RATE);
}

/**
 * Returns the current billing month in UTC YYYY-MM format.
 */
function getCurrentBillingMonth() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function billingMonthToStartDate(billingMonth) {
  const [year, month] = billingMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

function billingMonthToEndDate(billingMonth) {
  const [year, month] = billingMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - 1);
}

function isValidBillingMonth(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const month = parseInt(value.slice(5, 7), 10);
  return month >= 1 && month <= 12;
}

/**
 * Deterministic idempotency key combining subscription ID and billing month.
 */
function buildIdempotencyKey(subscriptionId, billingMonth) {
  return `sub_${subscriptionId}_month_${billingMonth}`;
}

module.exports = {
  bankersRound,
  calculateGstCents,
  getCurrentBillingMonth,
  billingMonthToStartDate,
  billingMonthToEndDate,
  isValidBillingMonth,
  buildIdempotencyKey,
  GST_RATE,
};
