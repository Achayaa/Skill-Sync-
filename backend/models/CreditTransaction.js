const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['earned', 'spent', 'bonus', 'refund'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
creditTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);

