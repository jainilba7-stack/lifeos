const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    habit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    completed: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

habitLogSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', habitLogSchema);
