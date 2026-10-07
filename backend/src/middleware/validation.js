const { query, body, validationResult } = require('express-validator');

// ---------------------------------------------------------------------------
// Reusable validation chains
// ---------------------------------------------------------------------------

/**
 * Validates the `month` query parameter.
 * Must be a YYYY-MM string representing a valid calendar month (01–12).
 *
 * Step 2: Input Validation — returns HTTP 400 on invalid input.
 */
const validateMonth = query('month')
  .optional()
  .isString()
  .withMessage('month must be a string')
  .matches(/^\d{4}-\d{2}$/)
  .withMessage('month must be in YYYY-MM format')
  .custom((value) => {
    const month = parseInt(value.slice(5, 7), 10);
    if (month < 1 || month > 12) {
      throw new Error('month must represent a valid calendar month (01–12)');
    }
    return true;
  });

/**
 * Validates the `page` query parameter.
 * Business rule: 1-based indexing (page ≥ 1).
 */
const validatePage = query('page')
  .optional()
  .isInt({ min: 1 })
  .withMessage('page must be an integer ≥ 1')
  .toInt();

/**
 * Validates the `limit` query parameter.
 * Allowed range: 1–200 items per page.
 */
const validateLimit = query('limit')
  .optional()
  .isInt({ min: 1, max: 200 })
  .withMessage('limit must be an integer between 1 and 200')
  .toInt();

/**
 * Validates the `status` query parameter.
 * Must be one of the three allowed RenewalEvent statuses.
 */
const validateStatus = query('status')
  .optional()
  .isIn(['scheduled', 'charged', 'failed'])
  .withMessage('status must be one of: scheduled, charged, failed');

// ---------------------------------------------------------------------------
// Body validation rules for POST /api/renewals/generate
// ---------------------------------------------------------------------------

/**
 * Validates the `month` field in the request body (for renewal generation).
 */
const validateBodyMonth = body('month')
  .optional()
  .isString()
  .withMessage('month must be a string')
  .matches(/^\d{4}-\d{2}$/)
  .withMessage('month must be in YYYY-MM format')
  .custom((value) => {
    const month = parseInt(value.slice(5, 7), 10);
    if (month < 1 || month > 12) {
      throw new Error('month must represent a valid calendar month (01–12)');
    }
    return true;
  });

// ---------------------------------------------------------------------------
// Middleware: handle validation errors
// ---------------------------------------------------------------------------

/**
 * Express middleware that checks the result of preceding express-validator
 * chains and short-circuits with an HTTP 400 response containing structured
 * error details if any validation failed.
 *
 * Step 2: Returns structured JSON on validation failure:
 * {
 *   "error": "Validation failed",
 *   "details": [
 *     { "field": "month", "message": "month must be in YYYY-MM format", "value": "bad-input" }
 *   ]
 * }
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path ?? err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
}

// ---------------------------------------------------------------------------
// Composed middleware arrays (plug directly into Express routes)
// ---------------------------------------------------------------------------

/**
 * Full validation middleware for GET /api/renewals (history endpoint).
 * Validates: month, page, limit, status.
 */
const validateRenewalHistoryQuery = [
  validateMonth,
  validatePage,
  validateLimit,
  validateStatus,
  handleValidationErrors,
];

/**
 * Full validation middleware for POST /api/renewals/generate.
 * Validates: month (body).
 */
const validateGenerateRenewals = [
  validateBodyMonth,
  handleValidationErrors,
];

module.exports = {
  validateMonth,
  validatePage,
  validateLimit,
  validateStatus,
  validateBodyMonth,
  handleValidationErrors,
  validateRenewalHistoryQuery,
  validateGenerateRenewals,
};
