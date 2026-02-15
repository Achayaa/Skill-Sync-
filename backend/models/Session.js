const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 15,
    max: 480, // 8 hours max
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
  },
  feedback: {
    fromLearner: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String, maxlength: 500 },
      submittedAt: { type: Date },
    },
    fromTeacher: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String, maxlength: 500 },
      submittedAt: { type: Date },
    },
  },
  creditsSpent: {
    type: Number,
    required: true,
    min: 0,
  },
  meetingLink: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    maxlength: 1000,
    default: '',
  },
}, {
  timestamps: true,
});

// Index for efficient queries
sessionSchema.index({ teacher: 1, status: 1 });
sessionSchema.index({ learner: 1, status: 1 });
sessionSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model('Session', sessionSchema);

