const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get user habits with current streaks and logs
// @route   GET /api/habits
exports.getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ user: req.user.id }).sort({ createdAt: -1 });

    // Fetch logs for the past 90 days for GitHub-style heatmap
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDateStr = ninetyDaysAgo.toISOString().split('T')[0];

    const logs = await HabitLog.find({
      user: req.user.id,
      date: { $gte: startDateStr }
    });

    return ApiResponse.success(res, 'Habits retrieved successfully', {
      habits,
      logs,
      count: habits.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new habit
// @route   POST /api/habits
exports.createHabit = async (req, res, next) => {
  try {
    const { title, description, category, color } = req.body;

    const habit = await Habit.create({
      user: req.user.id,
      title,
      description,
      category: category || 'Exercise',
      color: color || '#10b981',
      streakCurrent: 0,
      streakBest: 0
    });

    return ApiResponse.success(res, 'Habit created successfully', { habit }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle habit completion for today or specific date
// @route   POST /api/habits/:id/toggle
exports.toggleHabitLog = async (req, res, next) => {
  try {
    const { date } = req.body;
    const targetDateStr = date || new Date().toISOString().split('T')[0];

    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
    if (!habit) {
      return ApiResponse.error(res, 'Habit not found', [], 404);
    }

    let existingLog = await HabitLog.findOne({
      user: req.user.id,
      habit: habit._id,
      date: targetDateStr
    });

    let completedStatus = true;

    if (existingLog) {
      existingLog.completed = !existingLog.completed;
      completedStatus = existingLog.completed;
      await existingLog.save();
    } else {
      await HabitLog.create({
        user: req.user.id,
        habit: habit._id,
        date: targetDateStr,
        completed: true
      });
    }

    // Recalculate Streaks for this habit
    const allLogs = await HabitLog.find({
      user: req.user.id,
      habit: habit._id,
      completed: true
    }).sort({ date: -1 });

    const completedDates = new Set(allLogs.map((l) => l.date));

    // Calculate current streak backward from today
    let currentStreak = 0;
    let checkDate = new Date();

    // Check today first
    let todayStr = checkDate.toISOString().split('T')[0];
    if (!completedDates.has(todayStr)) {
      // If not completed today, check if completed yesterday to keep streak alive
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      let dateStr = checkDate.toISOString().split('T')[0];
      if (completedDates.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    habit.streakCurrent = currentStreak;
    if (currentStreak > habit.streakBest) {
      habit.streakBest = currentStreak;
    }
    if (completedStatus) {
      habit.lastCompletedDate = targetDateStr;
    }

    await habit.save();

    return ApiResponse.success(
      res,
      `Habit marked as ${completedStatus ? 'completed' : 'uncompleted'}`,
      { habit, logDate: targetDateStr, completed: completedStatus }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Delete habit
// @route   DELETE /api/habits/:id
exports.deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!habit) {
      return ApiResponse.error(res, 'Habit not found', [], 404);
    }
    await HabitLog.deleteMany({ habit: habit._id });
    return ApiResponse.success(res, 'Habit and logs deleted successfully');
  } catch (error) {
    next(error);
  }
};
