const cron = require('node-cron');
const Document = require('../models/Document');
const Medicine = require('../models/Medicine');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

const initScheduledJobs = () => {
  console.log('[LifeOS Cron] Initializing background reminder and audit schedules...');

  // Run every hour to check document expiries and budget warnings
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(now.getDate() + 30);

      // 1. Check Document Expiry
      const expiringDocs = await Document.find({
        expiryDate: { $gte: now, $lte: thirtyDaysLater }
      });

      for (const doc of expiringDocs) {
        const daysLeft = Math.ceil((new Date(doc.expiryDate) - now) / (1000 * 60 * 60 * 24));
        const message = `Your document '${doc.name}' (${doc.category}) will expire in ${daysLeft} days.`;
        
        // Avoid duplicate notification within 24h
        const existing = await Notification.findOne({
          user: doc.user,
          type: 'Document expiry',
          message,
          createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) }
        });

        if (!existing) {
          await Notification.create({
            user: doc.user,
            title: 'Document Expiry Warning',
            message,
            type: 'Document expiry',
            link: '/pages/documents.html'
          });
        }
      }

      // 2. Check Overdue Goals
      const overdueGoals = await Goal.find({
        status: 'active',
        deadline: { $lt: now }
      });

      for (const goal of overdueGoals) {
        goal.status = 'overdue';
        await goal.save();

        await Notification.create({
          user: goal.user,
          title: 'Goal Overdue',
          message: `Your goal '${goal.title}' has passed its deadline.`,
          type: 'Goal deadline',
          link: '/pages/goals.html'
        });
      }

      // 3. Check Monthly Budget Spending
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const budgets = await Budget.find({ month: currentMonth, year: currentYear });
      for (const budget of budgets) {
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        const expenses = await Expense.aggregate([
          {
            $match: {
              user: budget.user,
              type: 'expense',
              date: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
        ]);

        const totalSpent = expenses.length > 0 ? expenses[0].totalSpent : 0;
        if (totalSpent >= budget.monthlyLimit * 0.8) {
          const percent = Math.round((totalSpent / budget.monthlyLimit) * 100);
          const message = `Warning: You have used ${percent}% of your monthly budget (Spent ₹${totalSpent} / ₹${budget.monthlyLimit}).`;

          const existing = await Notification.findOne({
            user: budget.user,
            type: 'Budget warning',
            createdAt: { $gte: new Date(now - 48 * 60 * 60 * 1000) }
          });

          if (!existing) {
            await Notification.create({
              user: budget.user,
              title: 'Budget Alert',
              message,
              type: 'Budget warning',
              link: '/pages/expenses.html'
            });
          }
        }
      }
    } catch (err) {
      console.error('[LifeOS Cron] Error running hourly checks:', err.message);
    }
  });

  // Run every 15 minutes for Medicine and Appointment reminders
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      // Check Medicines
      const medicines = await Medicine.find({ reminderTime: currentTimeStr });
      for (const med of medicines) {
        await Notification.create({
          user: med.user,
          title: 'Medicine Reminder',
          message: `Time to take ${med.name} (${med.dosage}) - ${med.instructions}`,
          type: 'Medicine reminder',
          link: '/pages/medicines.html'
        });
      }
    } catch (err) {
      console.error('[LifeOS Cron] Error running 15m medicine checks:', err.message);
    }
  });
};

module.exports = { initScheduledJobs };
