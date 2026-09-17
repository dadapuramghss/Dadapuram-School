const mongoose = require('mongoose');

const classConfigSchema = new mongoose.Schema({
  standard: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  subjects: [{
    type: String,
    trim: true
  }],
  timetableConfig: {
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    periodsPerDay: {
      type: Number,
      default: 8
    },
    periodTimings: [{
      period: Number,
      startTime: String,
      endTime: String
    }],
    subjectFrequencies: [{
      subjectId: String,
      subjectName: String,
      weeklyPeriods: Number,
      type: {
        type: String,
        enum: ['subject', 'pt', 'art', 'activity', 'free'],
        default: 'subject'
      }
    }]
  }
}, {
  timestamps: true
});

// Ensure unique standard and section combination
classConfigSchema.index({ standard: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('ClassConfig', classConfigSchema);
