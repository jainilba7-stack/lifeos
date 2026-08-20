const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all expenses & financial summary for current user
// @route   GET /api/expenses
exports.getExpenses = async (req, res, next) => {
  try {
    const { category, type, startDate, endDate, month, year } = req.query;
    const query = { user: req.user.id };

    if (category && category !== 'All') query.category = category;
    if (type && type !== 'All') query.type = type;

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    // Calculate Summary Metrics
    const now = new Date();
    const selYear = year ? parseInt(year, 10) : now.getFullYear();
    const selMonth = month ? parseInt(month, 10) : now.getMonth() + 1;

    const startOfMonth = new Date(selYear, selMonth - 1, 1);
    const endOfMonth = new Date(selYear, selMonth, 0, 23, 59, 59);

    const monthlyRecords = await Expense.find({
      user: req.user.id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    monthlyRecords.forEach((item) => {
      if (item.type === 'income') totalIncome += item.amount;
      else totalExpenses += item.amount;
    });

    const totalSavings = totalIncome - totalExpenses;

    // Get current budget
    const budgetDoc = await Budget.findOne({
      user: req.user.id,
      month: selMonth,
      year: selYear
    });

    const monthlyLimit = budgetDoc ? budgetDoc.monthlyLimit : 0;
    const remainingBudget = monthlyLimit > 0 ? monthlyLimit - totalExpenses : 0;
    const isOverBudget = monthlyLimit > 0 && totalExpenses > monthlyLimit;
    const isNearBudget = monthlyLimit > 0 && totalExpenses >= monthlyLimit * 0.8;

    return ApiResponse.success(res, 'Expenses & Financial summary retrieved', {
      expenses,
      summary: {
        totalIncome,
        totalExpenses,
        totalSavings,
        monthlyLimit,
        remainingBudget,
        isOverBudget,
        isNearBudget,
        month: selMonth,
        year: selYear
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new income or expense transaction
// @route   POST /api/expenses
exports.createExpense = async (req, res, next) => {
  try {
    const { amount, type, category, description, date, paymentMethod } = req.body;

    const transaction = await Expense.create({
      user: req.user.id,
      amount,
      type: type || 'expense',
      category: category || 'Other',
      description,
      date: date ? new Date(date) : new Date(),
      paymentMethod
    });

    return ApiResponse.success(res, 'Transaction added successfully', { transaction }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense transaction
// @route   PUT /api/expenses/:id
exports.updateExpense = async (req, res, next) => {
  try {
    let transaction = await Expense.findOne({ _id: req.params.id, user: req.user.id });
    if (!transaction) {
      return ApiResponse.error(res, 'Transaction not found or unauthorized', [], 404);
    }

    const { amount, type, category, description, date, paymentMethod } = req.body;
    if (amount !== undefined) transaction.amount = amount;
    if (type !== undefined) transaction.type = type;
    if (category !== undefined) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = new Date(date);
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;

    await transaction.save();
    return ApiResponse.success(res, 'Transaction updated successfully', { transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res, next) => {
  try {
    const transaction = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!transaction) {
      return ApiResponse.error(res, 'Transaction not found or unauthorized', [], 404);
    }
    return ApiResponse.success(res, 'Transaction deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Set or update monthly budget
// @route   POST /api/expenses/budget
exports.setBudget = async (req, res, next) => {
  try {
    const { monthlyLimit, month, year } = req.body;
    const now = new Date();

    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    let budget = await Budget.findOne({
      user: req.user.id,
      month: targetMonth,
      year: targetYear
    });

    if (budget) {
      budget.monthlyLimit = monthlyLimit;
      await budget.save();
    } else {
      budget = await Budget.create({
        user: req.user.id,
        monthlyLimit,
        month: targetMonth,
        year: targetYear
      });
    }

    return ApiResponse.success(res, 'Monthly budget updated successfully', { budget });
  } catch (error) {
    next(error);
  }
};
