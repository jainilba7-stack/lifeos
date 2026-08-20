const Task = require('../models/Task');
const Expense = require('../models/Expense');
const Document = require('../models/Document');
const Goal = require('../models/Goal');
const Habit = require('../models/Habit');
const Reminder = require('../models/Reminder');
const Budget = require('../models/Budget');

const generateSmartInsights = async (userId) => {
  const insights = [];
  const now = new Date();

  // 1. Task Completion Rate Insight
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  const totalTasksWeek = await Task.countDocuments({
    user: userId,
    createdAt: { $gte: oneWeekAgo }
  });

  if (totalTasksWeek > 0) {
    const completedTasksWeek = await Task.countDocuments({
      user: userId,
      isCompleted: true,
      createdAt: { $gte: oneWeekAgo }
    });
    const completionRate = Math.round((completedTasksWeek / totalTasksWeek) * 100);
    insights.push({
      id: 'task-completion',
      type: completionRate >= 70 ? 'positive' : 'warning',
      category: 'Productivity',
      icon: 'check-circle',
      title: 'Weekly Task Velocity',
      message: `You completed ${completionRate}% of tasks created in the last 7 days (${completedTasksWeek}/${totalTasksWeek}).`
    });
  }

  // 2. Spending Month-over-Month Comparison
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const startThisMonth = new Date(currentYear, currentMonth, 1);
  const startLastMonth = new Date(currentYear, currentMonth - 1, 1);
  const endLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const thisMonthExpenses = await Expense.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        date: { $gte: startThisMonth }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const lastMonthExpenses = await Expense.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        date: { $gte: startLastMonth, $lte: endLastMonth }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const spentThisMonth = thisMonthExpenses[0]?.total || 0;
  const spentLastMonth = lastMonthExpenses[0]?.total || 0;

  if (spentLastMonth > 0 && spentThisMonth > 0) {
    const diffPercent = Math.round(((spentThisMonth - spentLastMonth) / spentLastMonth) * 100);
    if (diffPercent > 0) {
      insights.push({
        id: 'expense-compare',
        type: 'warning',
        category: 'Finance',
        icon: 'trending-up',
        title: 'Spending Acceleration',
        message: `Your spending this month is ${diffPercent}% higher than this time last month (₹${spentThisMonth.toLocaleString()} vs ₹${spentLastMonth.toLocaleString()}).`
      });
    } else if (diffPercent < 0) {
      insights.push({
        id: 'expense-compare',
        type: 'positive',
        category: 'Finance',
        icon: 'trending-down',
        title: 'Smart Savings',
        message: `Great job! Your spending this month is ${Math.abs(diffPercent)}% lower than last month.`
      });
    }
  }

  // 3. Document Expiry Alert
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(now.getDate() + 30);

  const expiringDoc = await Document.findOne({
    user: userId,
    expiryDate: { $gte: now, $lte: thirtyDaysLater }
  }).sort({ expiryDate: 1 });

  if (expiringDoc) {
    const daysLeft = Math.ceil((new Date(expiringDoc.expiryDate) - now) / (1000 * 60 * 60 * 24));
    insights.push({
      id: 'doc-expiry',
      type: daysLeft <= 7 ? 'urgent' : 'warning',
      category: 'Documents',
      icon: 'file-text',
      title: 'Upcoming Document Expiry',
      message: `Your document '${expiringDoc.name}' (${expiringDoc.category}) expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
    });
  }

  // 4. Stale Goal Progress Check
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const staleGoal = await Goal.findOne({
    user: userId,
    status: 'active',
    updatedAt: { $lt: sevenDaysAgo }
  });

  if (staleGoal) {
    insights.push({
      id: 'stale-goal',
      type: 'info',
      category: 'Goals',
      icon: 'target',
      title: 'Goal Check-in Needed',
      message: `You haven't updated progress for your active goal '${staleGoal.title}' in over 7 days.`
    });
  }

  // 5. Active Habit Streaks
  const topHabit = await Habit.findOne({ user: userId, streakCurrent: { $gt: 0 } }).sort({
    streakCurrent: -1
  });
  if (topHabit) {
    insights.push({
      id: 'habit-streak',
      type: 'positive',
      category: 'Habits',
      icon: 'zap',
      title: 'Habit Momentum 🔥',
      message: `You are on a ${topHabit.streakCurrent}-day streak for '${topHabit.title}'! Keep it up!`
    });
  }

  // 6. Upcoming Bill Reminder
  const upcomingBill = await Reminder.findOne({
    user: userId,
    type: 'Bill',
    isSent: false,
    dateTime: { $gte: now, $lte: thirtyDaysLater }
  }).sort({ dateTime: 1 });

  if (upcomingBill) {
    const daysLeft = Math.ceil((new Date(upcomingBill.dateTime) - now) / (1000 * 60 * 60 * 24));
    insights.push({
      id: 'bill-due',
      type: daysLeft <= 3 ? 'urgent' : 'info',
      category: 'Finance',
      icon: 'credit-card',
      title: 'Bill Due Soon',
      message: `Your bill '${upcomingBill.title}' is due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
    });
  }

  // Fallback default insight if user has no metrics yet
  if (insights.length === 0) {
    insights.push({
      id: 'welcome-insight',
      type: 'info',
      category: 'General',
      icon: 'smile',
      title: 'Welcome to LifeOS',
      message: 'Start adding your tasks, habits, and expenses to generate personalized smart life insights!'
    });
  }

  return insights;
};

module.exports = { generateSmartInsights };
