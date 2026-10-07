/**
 * Unit tests for billingHelpers utility.
 * Tests Banker's Rounding, GST calculation, billing month utilities,
 * and idempotency key generation.
 */
const {
  bankersRound,
  calculateGstCents,
  getCurrentBillingMonth,
  isValidBillingMonth,
  buildIdempotencyKey,
} = require('../src/utils/billingHelpers');

describe('bankersRound (half-to-even)', () => {
  test('rounds down when fraction < 0.5', () => {
    expect(bankersRound(1.4)).toBe(1);
    expect(bankersRound(2.3)).toBe(2);
  });

  test('rounds up when fraction > 0.5', () => {
    expect(bankersRound(1.6)).toBe(2);
    expect(bankersRound(2.7)).toBe(3);
  });

  test('rounds to even when fraction === 0.5 and floor is even', () => {
    expect(bankersRound(0.5)).toBe(0); // 0 is even → stay at 0
    expect(bankersRound(2.5)).toBe(2); // 2 is even → stay at 2
    expect(bankersRound(4.5)).toBe(4); // 4 is even → stay at 4
  });

  test('rounds to even when fraction === 0.5 and floor is odd', () => {
    expect(bankersRound(1.5)).toBe(2); // 1 is odd → round up to 2
    expect(bankersRound(3.5)).toBe(4); // 3 is odd → round up to 4
  });

  test('handles integers exactly', () => {
    expect(bankersRound(5)).toBe(5);
    expect(bankersRound(0)).toBe(0);
  });
});

describe('calculateGstCents (18% GST)', () => {
  test('calculates 18% of 1000 cents correctly', () => {
    // 1000 * 0.18 = 180 — no rounding needed
    expect(calculateGstCents(1000)).toBe(180);
  });

  test('calculates 18% of 999 cents with Banker\'s Rounding', () => {
    // 999 * 0.18 = 179.82 → floor is 179, fraction 0.82 > 0.5 → rounds up to 180
    expect(calculateGstCents(999)).toBe(180);
  });

  test('calculates 18% of 1999 cents', () => {
    // 1999 * 0.18 = 359.82 → rounds up to 360
    expect(calculateGstCents(1999)).toBe(360);
  });

  test('calculates 18% of 4999 cents', () => {
    // 4999 * 0.18 = 899.82 → rounds up to 900
    expect(calculateGstCents(4999)).toBe(900);
  });

  test('returns 0 GST on 0 cents', () => {
    expect(calculateGstCents(0)).toBe(0);
  });

  test('throws on negative amount', () => {
    expect(() => calculateGstCents(-1)).toThrow();
  });

  test('throws on non-integer amount', () => {
    expect(() => calculateGstCents(9.99)).toThrow();
  });
});

describe('getCurrentBillingMonth', () => {
  test('returns a string matching YYYY-MM format', () => {
    const result = getCurrentBillingMonth();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  test('returns a valid month (01–12)', () => {
    const result = getCurrentBillingMonth();
    const month = parseInt(result.slice(5, 7), 10);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });
});

describe('isValidBillingMonth', () => {
  test('accepts valid months', () => {
    expect(isValidBillingMonth('2024-01')).toBe(true);
    expect(isValidBillingMonth('2024-12')).toBe(true);
    expect(isValidBillingMonth('2000-06')).toBe(true);
  });

  test('rejects month 00 and month 13+', () => {
    expect(isValidBillingMonth('2024-00')).toBe(false);
    expect(isValidBillingMonth('2024-13')).toBe(false);
  });

  test('rejects wrong format', () => {
    expect(isValidBillingMonth('2024-1')).toBe(false);
    expect(isValidBillingMonth('24-01')).toBe(false);
    expect(isValidBillingMonth('2024/01')).toBe(false);
    expect(isValidBillingMonth('invalid')).toBe(false);
    expect(isValidBillingMonth(202401)).toBe(false);
  });

  test('rejects null and undefined', () => {
    expect(isValidBillingMonth(null)).toBe(false);
    expect(isValidBillingMonth(undefined)).toBe(false);
  });
});

describe('buildIdempotencyKey', () => {
  test('produces deterministic key from subscriptionId and month', () => {
    const key = buildIdempotencyKey('abc123', '2024-03');
    expect(key).toBe('sub_abc123_month_2024-03');
  });

  test('same inputs always produce the same key', () => {
    const k1 = buildIdempotencyKey('xyz', '2024-01');
    const k2 = buildIdempotencyKey('xyz', '2024-01');
    expect(k1).toBe(k2);
  });

  test('different months produce different keys', () => {
    const k1 = buildIdempotencyKey('abc', '2024-01');
    const k2 = buildIdempotencyKey('abc', '2024-02');
    expect(k1).not.toBe(k2);
  });
});
