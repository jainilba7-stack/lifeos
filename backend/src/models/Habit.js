const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Habit title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    category: {
      type: String,
      enum: ['Exercise', 'Reading', 'Study', 'Water', 'Meditation', 'Coding', 'Health', 'Other'],
      default: 'Exercise'
    },
    color: {
      type: String,
      default: '#10b981' // Hex color for heatmap
    },
    streakCurrent: {
      type: Number,
      default: 0
    },
    streakBest: {
      type: Number,
      default: 0
    },
    lastCompletedDate: {
      type: String // YYYY-MM-DD
    }
  },
  { timestamps: true }
);

habitSchema.index({ user: 1 });

module.exports = mongoose.model('Habit', habitSchema);
