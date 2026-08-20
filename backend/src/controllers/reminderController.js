const Reminder = require('../models/Reminder');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get central reminders
// @route   GET /api/reminders
exports.getReminders = async (req, res, next) => {
  try {
    const { type, filter } = req.query;
    const query = { user: req.user.id };

    if (type && type !== 'All') query.type = type;

    const now = new Date();
    if (filter === 'upcoming') {
      query.dateTime = { $gte: now };
    } else if (filter === 'past') {
      query.dateTime = { $lt: now };
    }

    const reminders = await Reminder.find(query).sort({ dateTime: 1 });
    return ApiResponse.success(res, 'Reminders retrieved successfully', { reminders, count: reminders.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Create reminder
// @route   POST /api/reminders
exports.createReminder = async (req, res, next) => {
  try {
    const { title, type, dateTime, repeatFrequency, notes } = req.body;

    const reminder = await Reminder.create({
      user: req.user.id,
      title,
      type: type || 'Personal',
      dateTime: new Date(dateTime),
      repeatFrequency: repeatFrequency || 'none',
      notes
    });

    return ApiResponse.success(res, 'Reminder created successfully', { reminder }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
exports.updateReminder = async (req, res, next) => {
  try {
    let reminder = await Reminder.findOne({ _id: req.params.id, user: req.user.id });
    if (!reminder) {
      return ApiResponse.error(res, 'Reminder not found or unauthorized', [], 404);
    }

    const { title, type, dateTime, repeatFrequency, notes, isSent } = req.body;
    if (title !== undefined) reminder.title = title;
    if (type !== undefined) reminder.type = type;
    if (dateTime !== undefined) reminder.dateTime = new Date(dateTime);
    if (repeatFrequency !== undefined) reminder.repeatFrequency = repeatFrequency;
    if (notes !== undefined) reminder.notes = notes;
    if (isSent !== undefined) reminder.isSent = Boolean(isSent);

    await reminder.save();
    return ApiResponse.success(res, 'Reminder updated successfully', { reminder });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
exports.deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!reminder) {
      return ApiResponse.error(res, 'Reminder not found or unauthorized', [], 404);
    }
    return ApiResponse.success(res, 'Reminder deleted successfully');
  } catch (error) {
    next(error);
  }
};
