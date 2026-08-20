const Task = require('../models/Task');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get aggregated platform analytics
// @route   GET /api/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Productivity Analytics
    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ user: userId, isCompleted: true });
    const pendingTasks = totalTasks - completedTasks;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const tasksByCategory = await Task.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // 2. Finance Analytics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const financialTotals = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    let incomeThisMonth = 0;
    let expenseThisMonth = 0;
    financialTotals.forEach((item) => {
      if (item._id === 'income') incomeThisMonth = item.total;
      if (item._id === 'expense') expenseThisMonth = item.total;
    });

    const categorySpending = await Expense.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    // 3. Goal Analytics
    const goals = await Goal.find({ user: userId });
    const activeGoals = goals.filter((g) => g.status === 'active').length;
    const completedGoals = goals.filter((g) => g.status === 'completed').length;

    let totalGoalProgressPercent = 0;
    goals.forEach((g) => {
      const pct = g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0;
      totalGoalProgressPercent += pct;
    });
    const avgGoalProgress = goals.length > 0 ? Math.round(totalGoalProgressPercent / goals.length) : 0;

    // 4. Habit Analytics
    const habits = await Habit.find({ user: userId });
    let maxBestStreak = 0;
    let currentMaxStreak = 0;

    habits.forEach((h) => {
      if (h.streakBest > maxBestStreak) maxBestStreak = h.streakBest;
      if (h.streakCurrent > currentMaxStreak) currentMaxStreak = h.streakCurrent;
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const habitLogCount = await HabitLog.countDocuments({
      user: userId,
      completed: true,
      date: { $gte: dateStr }
    });

    return ApiResponse.success(res, 'Analytics generated successfully', {
      productivity: {
        totalTasks,
        completedTasks,
        pendingTasks,
        taskCompletionRate,
        tasksByCategory
      },
      finance: {
        incomeThisMonth,
        expenseThisMonth,
        savingsThisMonth: incomeThisMonth - expenseThisMonth,
        categorySpending
      },
      goals: {
        totalGoals: goals.length,
        activeGoals,
        completedGoals,
        avgGoalProgress
      },
      habits: {
        totalHabits: habits.length,
        currentMaxStreak,
        maxBestStreak,
        monthlyCompletions: habitLogCount
      }
    });
  } catch (error) {
    next(error);
  }
};
