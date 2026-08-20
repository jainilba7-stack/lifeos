const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Reminder title is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['Bill', 'Birthday', 'Appointment', 'Document', 'Medicine', 'Task', 'Personal'],
      default: 'Personal'
    },
    dateTime: {
      type: Date,
      required: [true, 'Date and time is required']
    },
    isSent: {
      type: Boolean,
      default: false
    },
    repeatFrequency: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

reminderSchema.index({ user: 1, dateTime: 1, isSent: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
