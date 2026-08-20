const Note = require('../models/Note');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get user notes
// @route   GET /api/notes
exports.getNotes = async (req, res, next) => {
  try {
    const { category, search, tag, archived, pinned } = req.query;
    const query = { user: req.user.id };

    if (archived === 'true') {
      query.isArchived = true;
    } else {
      query.isArchived = false;
    }

    if (pinned === 'true') query.isPinned = true;
    if (category && category !== 'All') query.category = category;
    if (tag) query.tags = tag;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 });

    return ApiResponse.success(res, 'Notes retrieved successfully', { notes, count: notes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Create note
// @route   POST /api/notes
exports.createNote = async (req, res, next) => {
  try {
    const { title, content, category, tags, isPinned, color } = req.body;

    const note = await Note.create({
      user: req.user.id,
      title,
      content: content || '',
      category: category || 'Personal',
      tags: Array.isArray(tags) ? tags : tags ? tags.split(',').map((t) => t.trim()) : [],
      isPinned: Boolean(isPinned),
      color: color || '#1e293b'
    });

    return ApiResponse.success(res, 'Note created successfully', { note }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update note
// @route   PUT /api/notes/:id
exports.updateNote = async (req, res, next) => {
  try {
    let note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) {
      return ApiResponse.error(res, 'Note not found or unauthorized', [], 404);
    }

    const { title, content, category, tags, isPinned, isArchived, color } = req.body;

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category;
    if (tags !== undefined) note.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    if (isPinned !== undefined) note.isPinned = Boolean(isPinned);
    if (isArchived !== undefined) note.isArchived = Boolean(isArchived);
    if (color !== undefined) note.color = color;

    await note.save();
    return ApiResponse.success(res, 'Note updated successfully', { note });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle pin note
// @route   PATCH /api/notes/:id/pin
exports.togglePinNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) {
      return ApiResponse.error(res, 'Note not found', [], 404);
    }
    note.isPinned = !note.isPinned;
    await note.save();
    return ApiResponse.success(res, `Note ${note.isPinned ? 'pinned' : 'unpinned'}`, { note });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) {
      return ApiResponse.error(res, 'Note not found or unauthorized', [], 404);
    }
    return ApiResponse.success(res, 'Note deleted successfully');
  } catch (error) {
    next(error);
  }
};
