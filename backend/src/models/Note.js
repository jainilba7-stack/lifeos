const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true
    },
    content: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['Personal', 'College', 'Work', 'Ideas', 'Finance', 'Other'],
      default: 'Personal'
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    isPinned: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: '#1e293b' // card background accent
    }
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, isPinned: -1, isArchived: 1, updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
