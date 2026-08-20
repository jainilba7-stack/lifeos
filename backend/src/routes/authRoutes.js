const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

router.post(
  '/register',
  [
    body('fullName', 'Full name is required').notEmpty(),
    body('username', 'Username must be at least 3 characters').isLength({ min: 3 }),
    body('email', 'Please provide a valid email address').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  validate,
  authController.register
);

router.post(
  '/verify-otp',
  [
    body('email', 'Email is required').isEmail(),
    body('otp', '6-digit OTP code is required').isLength({ min: 6, max: 6 })
  ],
  validate,
  authController.verifyOTP
);

router.post(
  '/resend-otp',
  [body('email', 'Email is required').isEmail()],
  validate,
  authController.resendOTP
);

router.post(
  '/login',
  [
    body('email', 'Email is required').isEmail(),
    body('password', 'Password is required').notEmpty()
  ],
  validate,
  authController.login
);

router.post(
  '/forgot-password',
  [body('email', 'Valid email is required').isEmail()],
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('email', 'Email is required').isEmail(),
    body('otp', '6-digit OTP is required').isLength({ min: 6, max: 6 }),
    body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
  ],
  validate,
  authController.resetPassword
);

router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;
