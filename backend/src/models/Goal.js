const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    category: {
      type: String,
      enum: ['Education', 'Health', 'Finance', 'Career', 'Personal', 'Fitness', 'Other'],
      default: 'Personal'
    },
    targetValue: {
      type: Number,
      default: 100
    },
    currentValue: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: '%' // e.g. %, problems, ₹, kg
    },
    deadline: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'overdue'],
      default: 'active'
    }
  },
  { timestamps: true }
);

goalSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Goal', goalSchema);
