const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { sendPasswordResetEmail } = require('../services/emailService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'lifeos_super_secret_jwt_key_2026_change_this_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register new user & activate account immediately (No OTP required)
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return ApiResponse.error(res, 'Passwords do not match', [], 400);
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return ApiResponse.error(res, 'Email address is already registered', [], 400);
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return ApiResponse.error(res, 'Username is already taken', [], 400);
    }

    // Create user as fully verified immediately
    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      isVerified: true
    });

    const token = generateToken(user._id);

    return ApiResponse.success(
      res,
      'Registration successful! Welcome to LifeOS.',
      {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified
        }
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email OTP (Kept for backwards compatibility)
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return ApiResponse.error(res, 'User not found', [], 404);
    }

    user.isVerified = true;
    await user.save();
    const token = generateToken(user._id);

    return ApiResponse.success(res, 'Account verified successfully!', {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        isVerified: true
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP Code (Kept for backwards compatibility)
// @route   POST /api/auth/resend-otp
exports.resendOTP = async (req, res, next) => {
  return ApiResponse.success(res, 'Account is active.');
};

// @desc    Login user (Direct login without OTP checks)
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return ApiResponse.error(res, 'Invalid credentials', [], 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid credentials', [], 401);
    }

    // Auto-verify if legacy unverified record exists
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);

    return ApiResponse.success(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return ApiResponse.error(res, 'No user found with that email address', [], 404);
    }

    return ApiResponse.success(res, 'You can now reset your password directly.', {
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password Directly
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return ApiResponse.error(res, 'Passwords do not match', [], 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return ApiResponse.error(res, 'User not found', [], 404);
    }

    user.password = newPassword;
    await user.save();

    return ApiResponse.success(res, 'Password reset successful. Please log in with your new password.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return ApiResponse.success(res, 'User profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = async (req, res, next) => {
  return ApiResponse.success(res, 'Logged out successfully');
};
