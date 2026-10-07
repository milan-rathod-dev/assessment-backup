/**
 * Integration tests for Step 1 (Duplicate Prevention) and Step 2 (Input Validation).
 *
 * Uses supertest to make real HTTP requests against the Express app.
 * MongoDB is mocked using jest.mock so no real DB connection is needed.
 */
const request = require('supertest');
const app = require('../src/app');

// ---------------------------------------------------------------------------
// Mock the renewal service so DB calls are not made in unit tests
// ---------------------------------------------------------------------------
jest.mock('../src/services/renewalService', () => ({
  generateRenewals: jest.fn(),
  getRenewalHistory: jest.fn(),
  processWebhook: jest.fn(),
}));

const { generateRenewals, getRenewalHistory } = require('../src/services/renewalService');

// ---------------------------------------------------------------------------
// Step 2: Input Validation — POST /api/renewals/generate
// ---------------------------------------------------------------------------
describe('POST /api/renewals/generate — input validation (Step 2)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with valid month body', async () => {
    generateRenewals.mockResolvedValue({ newlyCreated: 5, existingCount: 0 });

    const res = await request(app)
      .post('/api/renewals/generate')
      .send({ month: '2024-03' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      billingMonth: '2024-03',
      newlyCreated: 5,
      existingCount: 0,
    });
  });

  test('returns 200 when month is omitted (uses current UTC month)', async () => {
    generateRenewals.mockResolvedValue({ newlyCreated: 3, existingCount: 1 });

    const res = await request(app)
      .post('/api/renewals/generate')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.newlyCreated).toBe(3);
    expect(res.body.existingCount).toBe(1);
  });

  test('returns 400 for invalid month format', async () => {
    const res = await request(app)
      .post('/api/renewals/generate')
      .send({ month: '2024-3' }); // missing leading zero

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details[0].field).toBe('month');
  });

  test('returns 400 for month 00', async () => {
    const res = await request(app)
      .post('/api/renewals/generate')
      .send({ month: '2024-00' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  test('returns 400 for month 13', async () => {
    const res = await request(app)
      .post('/api/renewals/generate')
      .send({ month: '2024-13' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  test('returns 400 for completely wrong format', async () => {
    const res = await request(app)
      .post('/api/renewals/generate')
      .send({ month: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});

// ---------------------------------------------------------------------------
// Step 2: Input Validation — GET /api/renewals
// ---------------------------------------------------------------------------
describe('GET /api/renewals — input validation (Step 2)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with valid query params', async () => {
    getRenewalHistory.mockResolvedValue({
      data: [], page: 1, limit: 20, total: 0, totalPages: 0,
    });

    const res = await request(app)
      .get('/api/renewals')
      .query({ month: '2024-03', page: '1', limit: '20', status: 'scheduled' });

    expect(res.status).toBe(200);
    expect(res.body.billingMonth).toBe('2024-03');
  });

  test('returns 400 for invalid month query param', async () => {
    const res = await request(app)
      .get('/api/renewals')
      .query({ month: '24-03' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details[0].field).toBe('month');
  });

  test('returns 400 for page=0 (must be ≥ 1)', async () => {
    const res = await request(app)
      .get('/api/renewals')
      .query({ page: '0' });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('page');
  });

  test('returns 400 for page=-1', async () => {
    const res = await request(app)
      .get('/api/renewals')
      .query({ page: '-1' });

    expect(res.status).toBe(400);
  });

  test('returns 400 for limit=0', async () => {
    const res = await request(app)
      .get('/api/renewals')
      .query({ limit: '0' });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('limit');
  });

  test('returns 400 for limit=201 (exceeds max 200)', async () => {
    const res = await request(app)
      .get('/api/renewals')
      .query({ limit: '201' });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('limit');
  });

  test('returns 400 for invalid status filter', async () => {
    const res = await request(app)
      .get('/api/renewals')
      .query({ status: 'pending' }); // not in allowed enum

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('status');
  });

  test('validation error response includes field, message, value', async () => {
    const res = await request(app)
      .get('/api/renewals')
      .query({ month: 'bad-month' });

    expect(res.status).toBe(400);
    const detail = res.body.details[0];
    expect(detail).toHaveProperty('field');
    expect(detail).toHaveProperty('message');
    expect(detail).toHaveProperty('value');
  });

  test('accepts all valid status values', async () => {
    getRenewalHistory.mockResolvedValue({
      data: [], page: 1, limit: 20, total: 0, totalPages: 0,
    });

    for (const status of ['scheduled', 'charged', 'failed']) {
      const res = await request(app)
        .get('/api/renewals')
        .query({ status });
      expect(res.status).toBe(200);
    }
  });
});

// ---------------------------------------------------------------------------
// Step 1: Duplicate Prevention response shape
// ---------------------------------------------------------------------------
describe('POST /api/renewals/generate — duplicate prevention response (Step 1)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('response includes newlyCreated and existingCount', async () => {
    generateRenewals.mockResolvedValue({ newlyCreated: 7, existingCount: 3 });

    const res = await request(app)
      .post('/api/renewals/generate')
      .send({ month: '2024-03' });

    expect(res.status).toBe(200);
    expect(typeof res.body.newlyCreated).toBe('number');
    expect(typeof res.body.existingCount).toBe('number');
    expect(res.body.newlyCreated).toBe(7);
    expect(res.body.existingCount).toBe(3);
  });

  test('existingCount is 0 when no duplicates', async () => {
    generateRenewals.mockResolvedValue({ newlyCreated: 10, existingCount: 0 });

    const res = await request(app)
      .post('/api/renewals/generate')
      .send({ month: '2024-04' });

    expect(res.body.existingCount).toBe(0);
    expect(res.body.newlyCreated).toBe(10);
  });

  test('newlyCreated is 0 when all are duplicates', async () => {
    generateRenewals.mockResolvedValue({ newlyCreated: 0, existingCount: 5 });

    const res = await request(app)
      .post('/api/renewals/generate')
      .send({ month: '2024-05' });

    expect(res.body.newlyCreated).toBe(0);
    expect(res.body.existingCount).toBe(5);
  });
});
