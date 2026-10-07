/**
 * Seed data for MonthStick Renewal Console.
 *
 * IMPORTANT: Per business rule #6, this file must NEVER be edited after
 * initial seeding. Add new data via the API or separate migration scripts.
 *
 * Amounts are in integer cents:
 *   $9.99  => 999
 *   $19.99 => 1999
 *   $49.99 => 4999
 */
const subscriptions = [
  { customerId: 'cust_001', plan: 'basic',      amountCents: 999,  status: 'active' },
  { customerId: 'cust_002', plan: 'pro',        amountCents: 1999, status: 'active' },
  { customerId: 'cust_003', plan: 'enterprise', amountCents: 4999, status: 'active' },
  { customerId: 'cust_004', plan: 'basic',      amountCents: 999,  status: 'active' },
  { customerId: 'cust_005', plan: 'pro',        amountCents: 1999, status: 'cancelled' },
  { customerId: 'cust_006', plan: 'pro',        amountCents: 1999, status: 'active' },
  { customerId: 'cust_007', plan: 'enterprise', amountCents: 4999, status: 'active' },
  { customerId: 'cust_008', plan: 'basic',      amountCents: 999,  status: 'paused' },
  { customerId: 'cust_009', plan: 'pro',        amountCents: 1999, status: 'active' },
  { customerId: 'cust_010', plan: 'enterprise', amountCents: 4999, status: 'active' },
];

module.exports = { subscriptions };
