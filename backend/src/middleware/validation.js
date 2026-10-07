const { query, body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

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

const validatePage = query('page')
  .optional()
  .isInt({ min: 1 })
  .withMessage('page must be an integer ≥ 1')
  .toInt();

const validateLimit = query('limit')
  .optional()
  .isInt({ min: 1, max: 200 })
  .withMessage('limit must be an integer between 1 and 200')
  .toInt();

const validateStatus = query('status')
  .optional()
  .isIn(['scheduled', 'charged', 'failed'])
  .withMessage('status must be one of: scheduled, charged, failed');

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

const validateIdParam = param('id')
  .isString()
  .custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('id must be a valid 24-character hexadecimal ObjectId');
    }
    return true;
  });

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

const validateRenewalHistoryQuery = [
  validateMonth,
  validatePage,
  validateLimit,
  validateStatus,
  handleValidationErrors,
];

const validateGenerateRenewals = [
  validateBodyMonth,
  handleValidationErrors,
];

const validateRetryRenewal = [
  validateIdParam,
  handleValidationErrors,
];

module.exports = {
  validateMonth,
  validatePage,
  validateLimit,
  validateStatus,
  validateBodyMonth,
  validateIdParam,
  handleValidationErrors,
  validateRenewalHistoryQuery,
  validateGenerateRenewals,
  validateRetryRenewal,
};
