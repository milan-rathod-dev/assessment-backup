/**
 * Financial and date utility helpers for MonthStick Renewal Console.
 *
 * Business rules enforced here:
 *  - UTC-only date/month calculations (no local timezone drift)
 *  - Banker's Rounding (half-to-even) for GST calculations
 *  - GST rate: 18%
 */

const GST_RATE = 0.18;

// ---------------------------------------------------------------------------
// Banker's Rounding (half-to-even)
// ---------------------------------------------------------------------------

/**
 * Rounds a number to the nearest integer using Banker's Rounding (half-to-even).
 *
 * Standard Math.round uses "round half up" which introduces statistical bias
 * over many transactions. Banker's Rounding eliminates that bias by rounding
 * ties to the nearest even integer.
 *
 * Examples:
 *   bankersRound(0.5) => 0   (rounds to even: 0)
 *   bankersRound(1.5) => 2   (rounds to even: 2)
 *   bankersRound(2.5) => 2   (rounds to even: 2)
 *   bankersRound(3.5) => 4   (rounds to even: 4)
 *
 * @param {number} value - The number to round.
 * @returns {number} Integer result after Banker's Rounding.
 */
function bankersRound(value) {
  const floor = Math.floor(value);
  const fraction = value - floor;

  if (fraction < 0.5) return floor;
  if (fraction > 0.5) return floor + 1;

  // Exactly 0.5 — round to nearest even
  return floor % 2 === 0 ? floor : floor + 1;
}

// ---------------------------------------------------------------------------
// GST calculation
// ---------------------------------------------------------------------------

/**
 * Calculates GST (18%) on an amount in cents using Banker's Rounding.
 *
 * @param {number} amountCents - The base charge amount in integer cents.
 * @returns {number} GST amount in integer cents.
 */
function calculateGstCents(amountCents) {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error(`amountCents must be a non-negative integer, received: ${amountCents}`);
  }
  return bankersRound(amountCents * GST_RATE);
}

// ---------------------------------------------------------------------------
// UTC billing month utilities
// ---------------------------------------------------------------------------

/**
 * Returns the current billing month as a UTC YYYY-MM string.
 *
 * Always uses UTC to avoid server timezone discrepancies — a server running
 * in UTC+5:30 would otherwise report a different month near midnight compared
 * to a server in UTC.
 *
 * @returns {string} Current billing month e.g. "2024-03"
 */
function getCurrentBillingMonth() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parses a YYYY-MM string and returns a UTC Date representing the first
 * millisecond of that month.
 *
 * Uses Date.UTC(...) to avoid any local timezone shifts.
 *
 * @param {string} billingMonth - Month string in YYYY-MM format.
 * @returns {Date} UTC Date at the start of the billing month.
 */
function billingMonthToStartDate(billingMonth) {
  const [year, month] = billingMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

/**
 * Parses a YYYY-MM string and returns a UTC Date representing the last
 * millisecond of that month.
 *
 * @param {string} billingMonth - Month string in YYYY-MM format.
 * @returns {Date} UTC Date at the end of the billing month.
 */
function billingMonthToEndDate(billingMonth) {
  const [year, month] = billingMonth.split('-').map(Number);
  // First ms of next month minus 1ms gives last ms of current month
  return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - 1);
}

/**
 * Validates that a string is in strict YYYY-MM format and represents a
 * real calendar month (month 01–12).
 *
 * @param {string} value - The string to validate.
 * @returns {boolean} True if valid billing month format.
 */
function isValidBillingMonth(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const month = parseInt(value.slice(5, 7), 10);
  return month >= 1 && month <= 12;
}

// ---------------------------------------------------------------------------
// Idempotency key generation
// ---------------------------------------------------------------------------

/**
 * Generates a deterministic idempotency key for a renewal event.
 * Combining subscriptionId + billingMonth ensures the same key is produced
 * on retries for the same renewal attempt, so the payment provider can
 * de-duplicate charges on its side too.
 *
 * @param {string} subscriptionId - Mongoose ObjectId as string.
 * @param {string} billingMonth   - YYYY-MM billing month.
 * @returns {string} Idempotency key.
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
