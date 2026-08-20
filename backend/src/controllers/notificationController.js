const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get user notifications
// @route   GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

    return ApiResponse.success(res, 'Notifications retrieved', { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return ApiResponse.error(res, 'Notification not found', [], 404);
    }
    return ApiResponse.success(res, 'Notification marked as read', { notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    return ApiResponse.success(res, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!notification) {
      return ApiResponse.error(res, 'Notification not found', [], 404);
    }
    return ApiResponse.success(res, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};
