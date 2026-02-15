const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a skill name'],
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['coding', 'design', 'language', 'business', 'music', 'writing', 'photography', 'other'],
    default: 'other',
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '📚',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Skill', skillSchema);

