const Task = require('../models/Task');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all tasks for current user (with search and filters)
// @route   GET /api/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, category, search, sort } = req.query;
    const query = { user: req.user.id };

    if (status === 'completed') {
      query.isCompleted = true;
    } else if (status === 'pending') {
      query.isCompleted = false;
    } else if (status === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (status === 'upcoming') {
      query.dueDate = { $gte: new Date() };
      query.isCompleted = false;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { isCompleted: 1, dueDate: 1, createdAt: -1 };
    if (sort === 'priority') {
      sortOption = { priority: -1, dueDate: 1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const tasks = await Task.find(query).sort(sortOption);
    return ApiResponse.success(res, 'Tasks retrieved successfully', { tasks, count: tasks.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new task
// @route   POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, category, priority, dueDate } = req.body;

    const task = await Task.create({
      user: req.user.id,
      title,
      description,
      category,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined
    });

    return ApiResponse.success(res, 'Task created successfully', { task }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return ApiResponse.error(res, 'Task not found or unauthorized', [], 404);
    }

    const { title, description, category, priority, dueDate, isCompleted } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (category !== undefined) task.category = category;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (isCompleted !== undefined) {
      task.isCompleted = isCompleted;
      task.completedAt = isCompleted ? new Date() : null;
    }

    await task.save();
    return ApiResponse.success(res, 'Task updated successfully', { task });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle task completion status
// @route   PATCH /api/tasks/:id/toggle
exports.toggleTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return ApiResponse.error(res, 'Task not found or unauthorized', [], 404);
    }

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;
    await task.save();

    return ApiResponse.success(res, `Task marked as ${task.isCompleted ? 'completed' : 'pending'}`, { task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return ApiResponse.error(res, 'Task not found or unauthorized', [], 404);
    }
    return ApiResponse.success(res, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};
