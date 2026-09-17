const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    required: true,
    index: true
  },
  day: {
    type: String,
    required: true
  },
  period: {
    type: Number,
    required: true
  },
  standard: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  subjectId: {
    type: String,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  teacherId: {
    type: String,
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['subject', 'pt', 'art', 'activity', 'free'],
    default: 'subject'
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes to help with conflict queries
timetableSchema.index({ academicYear: 1, day: 1, period: 1, standard: 1, section: 1, status: 1 });
timetableSchema.index({ academicYear: 1, day: 1, period: 1, teacherId: 1, status: 1 });
// For quick lookup of a teacher's schedule
timetableSchema.index({ teacherId: 1, status: 1 });
// For quick lookup of a class's schedule
timetableSchema.index({ standard: 1, section: 1, status: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
