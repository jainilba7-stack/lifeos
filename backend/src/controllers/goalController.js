const Goal = require('../models/Goal');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get user goals
// @route   GET /api/goals
exports.getGoals = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const query = { user: req.user.id };

    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;

    const goals = await Goal.find(query).sort({ deadline: 1 });

    const activeGoals = goals.filter((g) => g.status === 'active');
    const completedGoals = goals.filter((g) => g.status === 'completed');
    const overdueGoals = goals.filter((g) => g.status === 'overdue');

    return ApiResponse.success(res, 'Goals retrieved successfully', {
      goals,
      metrics: {
        total: goals.length,
        active: activeGoals.length,
        completed: completedGoals.length,
        overdue: overdueGoals.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create goal
// @route   POST /api/goals
exports.createGoal = async (req, res, next) => {
  try {
    const { title, description, category, targetValue, currentValue, unit, deadline } = req.body;

    const target = targetValue ? Number(targetValue) : 100;
    const current = currentValue ? Number(currentValue) : 0;
    const isCompleted = current >= target;

    const goal = await Goal.create({
      user: req.user.id,
      title,
      description,
      category,
      targetValue: target,
      currentValue: current,
      unit: unit || '%',
      deadline: deadline ? new Date(deadline) : undefined,
      status: isCompleted ? 'completed' : 'active'
    });

    return ApiResponse.success(res, 'Goal created successfully', { goal }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update goal details or progress
// @route   PUT /api/goals/:id
exports.updateGoal = async (req, res, next) => {
  try {
    let goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) {
      return ApiResponse.error(res, 'Goal not found or unauthorized', [], 404);
    }

    const { title, description, category, targetValue, currentValue, unit, deadline, status } = req.body;

    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (category !== undefined) goal.category = category;
    if (targetValue !== undefined) goal.targetValue = Number(targetValue);
    if (currentValue !== undefined) goal.currentValue = Number(currentValue);
    if (unit !== undefined) goal.unit = unit;
    if (deadline !== undefined) goal.deadline = deadline ? new Date(deadline) : null;

    if (status !== undefined) {
      goal.status = status;
    } else if (goal.currentValue >= goal.targetValue) {
      goal.status = 'completed';
    }

    await goal.save();
    return ApiResponse.success(res, 'Goal updated successfully', { goal });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
exports.deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!goal) {
      return ApiResponse.error(res, 'Goal not found or unauthorized', [], 404);
    }
    return ApiResponse.success(res, 'Goal deleted successfully');
  } catch (error) {
    next(error);
  }
};
