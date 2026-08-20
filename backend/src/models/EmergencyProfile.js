const mongoose = require('mongoose');

const emergencyProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown'
    },
    emergencyContactName: {
      type: String,
      default: '',
      trim: true
    },
    emergencyContactPhone: {
      type: String,
      default: '',
      trim: true
    },
    emergencyContactRelation: {
      type: String,
      default: '',
      trim: true
    },
    doctorContactName: {
      type: String,
      default: '',
      trim: true
    },
    doctorContactPhone: {
      type: String,
      default: '',
      trim: true
    },
    allergies: {
      type: String,
      default: '',
      trim: true
    },
    chronicConditions: {
      type: String,
      default: '',
      trim: true
    },
    importantNotes: {
      type: String,
      default: '',
      trim: true
    },
    // Fields explicitly chosen to be shared in the public QR code
    sharedInQR: {
      bloodGroup: { type: Boolean, default: true },
      emergencyContactName: { type: Boolean, default: true },
      emergencyContactPhone: { type: Boolean, default: true },
      allergies: { type: Boolean, default: true },
      importantNotes: { type: Boolean, default: false },
      doctorContactPhone: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyProfile', emergencyProfileSchema);
