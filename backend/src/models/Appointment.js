const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Appointment title is required'],
      trim: true
    },
    personOrOrg: {
      type: String,
      required: [true, 'Person or Organization name is required'],
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    time: {
      type: String, // HH:MM
      required: [true, 'Time is required']
    },
    location: {
      type: String,
      default: '',
      trim: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming'
    }
  },
  { timestamps: true }
);

appointmentSchema.index({ user: 1, date: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
