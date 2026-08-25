const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const generateOTP = require('../utils/generateOTP');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'lifeos_super_secret_jwt_key_2026_change_this_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register new user & send OTP
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

    const otpCode = generateOTP(6);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      isVerified: false,
      otp: {
        code: otpCode,
        expiresAt: otpExpires
      }
    });

    // Send OTP email asynchronously in background so registration response is INSTANT
    sendOTPEmail(user.email, otpCode, user.fullName).catch((err) => {
      console.error('[Email Dispatch Background Warning]:', err.message);
    });

    return ApiResponse.success(
      res,
      'Registration successful. Verification OTP sent to your email.',
      {
        userId: user._id,
        email: user.email,
        demoOtp: otpCode
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return ApiResponse.error(res, 'User not found', [], 404);
    }

    if (user.isVerified) {
      return ApiResponse.success(res, 'Account is already verified. You can log in.', {});
    }

    if (!user.otp || user.otp.code !== otp) {
      return ApiResponse.error(res, 'Invalid verification OTP code', [], 400);
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
      return ApiResponse.error(res, 'OTP has expired. Please request a new code.', [], 400);
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id);

    return ApiResponse.success(res, 'Account verified successfully!', {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP Code
// @route   POST /api/auth/resend-otp
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return ApiResponse.error(res, 'User not found', [], 404);
    }

    if (user.isVerified) {
      return ApiResponse.error(res, 'Account is already verified.', [], 400);
    }

    const otpCode = generateOTP(6);
    user.otp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    await user.save();

    sendOTPEmail(user.email, otpCode, user.fullName).catch((err) => {
      console.error('[Email Resend Background Warning]:', err.message);
    });

    return ApiResponse.success(res, 'New OTP verification code sent.', {
      demoOtp: otpCode
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
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

    if (!user.isVerified) {
      return ApiResponse.error(
        res,
        'Account is not verified. Please verify your OTP first.',
        { email: user.email, isVerified: false },
        403
      );
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

    const resetOtp = generateOTP(6);
    user.otp = {
      code: resetOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    await user.save();

    sendPasswordResetEmail(user.email, resetOtp, user.fullName).catch((err) => {
      console.error('[Reset Email Background Warning]:', err.message);
    });

    return ApiResponse.success(res, 'Password reset OTP sent to your email.', {
      email: user.email,
      demoOtp: resetOtp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return ApiResponse.error(res, 'Passwords do not match', [], 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return ApiResponse.error(res, 'User not found', [], 404);
    }

    if (!user.otp || user.otp.code !== otp) {
      return ApiResponse.error(res, 'Invalid reset OTP code', [], 400);
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
      return ApiResponse.error(res, 'Reset OTP code has expired', [], 400);
    }

    user.password = newPassword;
    user.otp = undefined;
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
