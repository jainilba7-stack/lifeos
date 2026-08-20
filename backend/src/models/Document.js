const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: [
        'Aadhaar',
        'PAN',
        'Passport',
        'Driving Licence',
        'Insurance',
        'Certificates',
        'Education',
        'Vehicle',
        'Bills',
        'Other'
      ],
      default: 'Other'
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    publicId: {
      type: String, // Cloudinary ID or local filename
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    fileType: {
      type: String,
      default: 'application/pdf'
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date
    },
    description: {
      type: String,
      default: '',
      trim: true
    }
  },
  { timestamps: true }
);

documentSchema.index({ user: 1, category: 1, expiryDate: 1 });

module.exports = mongoose.model('Document', documentSchema);
