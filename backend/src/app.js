require('dotenv').config();
const express = require('express');
const cors = require('cors');
const renewalsRouter = require('./routes/renewals');

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/renewals', renewalsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  const status = err.statusCode ?? 500;
  res.status(status).json({
    error: err.message ?? 'Internal server error',
  });
});

module.exports = app;
