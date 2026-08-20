const mongoose = require('mongoose');

const medicineLogSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['taken', 'missed', 'skipped'], default: 'taken' },
  takenAt: { type: Date, default: Date.now }
});

const medicineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required (e.g. 500mg, 1 tablet)'],
      trim: true
    },
    frequency: {
      type: String,
      default: 'Once Daily',
      trim: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    quantity: {
      type: Number,
      default: 10
    },
    reminderTime: {
      type: String, // HH:MM (24hr format)
      required: [true, 'Reminder time is required']
    },
    instructions: {
      type: String,
      default: 'Take after meal',
      trim: true
    },
    logs: [medicineLogSchema],
    disclaimerNotice: {
      type: String,
      default: 'For organizational and reminder purposes only. Not medical advice.'
    }
  },
  { timestamps: true }
);

medicineSchema.index({ user: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
