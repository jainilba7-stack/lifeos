const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return ApiResponse.error(res, 'Not authorized, no token provided', [], 401);
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'lifeos_super_secret_jwt_key_2026_change_this_in_production'
    );

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return ApiResponse.error(res, 'User no longer exists', [], 401);
    }

    if (!user.isVerified) {
      return ApiResponse.error(res, 'Account not verified. Please verify your OTP.', [], 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Not authorized, invalid or expired token', [error.message], 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route`,
        [],
        403
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
