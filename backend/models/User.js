const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'teacher'],
    default: 'teacher'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  loginCount: {
    type: Number,
    default: 0
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastActivityAt: {
    type: Date,
    default: null
  },
  activeStandard: {
    type: String,
    default: null
  },
  activeSection: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedClasses: [{
    standard: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: false,
      default: null
    },
    accessLevel: {
      type: String,
      enum: ['view', 'full'],
      default: 'full'
    },
    isClassTeacher: {
      type: Boolean,
      default: false
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
