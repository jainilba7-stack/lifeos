const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return ApiResponse.error(res, 'Validation failed', errorMessages, 400);
  }
  next();
};

module.exports = validate;
