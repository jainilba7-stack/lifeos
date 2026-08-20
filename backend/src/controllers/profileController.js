const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { processFileUpload } = require('../middleware/uploadMiddleware');

// @desc    Update user profile info
// @route   PUT /api/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return ApiResponse.error(res, 'User not found', [], 404);

    const { fullName, phone, dateOfBirth, bio, theme, emailNotifications } = req.body;

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (bio !== undefined) user.bio = bio;

    if (theme || emailNotifications !== undefined) {
      user.preferences = {
        theme: theme || user.preferences.theme,
        emailNotifications:
          emailNotifications !== undefined
            ? Boolean(emailNotifications)
            : user.preferences.emailNotifications
      };
    }

    if (req.file) {
      const hostUrl = `${req.protocol}://${req.get('host')}`;
      const fileRes = await processFileUpload(req.file, hostUrl);
      user.profileImage = fileRes.url;
    }

    await user.save();
    return ApiResponse.success(res, 'Profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/profile/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return ApiResponse.error(res, 'New passwords do not match', [], 400);
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return ApiResponse.error(res, 'User not found', [], 404);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return ApiResponse.error(res, 'Incorrect current password', [], 400);
    }

    user.password = newPassword;
    await user.save();

    return ApiResponse.success(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account and all associated resources
// @route   DELETE /api/profile
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Delete user's resources across models
    await Promise.all([
      User.findByIdAndDelete(userId),
      require('../models/Task').deleteMany({ user: userId }),
      require('../models/Expense').deleteMany({ user: userId }),
      require('../models/Budget').deleteMany({ user: userId }),
      require('../models/Medicine').deleteMany({ user: userId }),
      require('../models/Document').deleteMany({ user: userId }),
      require('../models/Goal').deleteMany({ user: userId }),
      require('../models/Habit').deleteMany({ user: userId }),
      require('../models/HabitLog').deleteMany({ user: userId }),
      require('../models/Appointment').deleteMany({ user: userId }),
      require('../models/Note').deleteMany({ user: userId }),
      require('../models/Reminder').deleteMany({ user: userId }),
      require('../models/Notification').deleteMany({ user: userId }),
      require('../models/EmergencyProfile').deleteMany({ user: userId })
    ]);

    return ApiResponse.success(res, 'Account and all associated data deleted permanently');
  } catch (error) {
    next(error);
  }
};
