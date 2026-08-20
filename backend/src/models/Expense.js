const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      default: 'expense'
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    category: {
      type: String,
      enum: [
        'Food',
        'Transport',
        'Shopping',
        'Education',
        'Health',
        'Bills',
        'Entertainment',
        'Salary',
        'Freelance',
        'Investment',
        'Other'
      ],
      default: 'Other'
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'],
      default: 'UPI'
    }
  },
  { timestamps: true }
);

expenseSchema.index({ user: 1, date: -1, type: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
