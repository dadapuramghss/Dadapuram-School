const mongoose = require('mongoose');

const studentFeedbackSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ["text", "voice"],
    required: true
  },
  message: {
    type: String,
    maxlength: 1000,
    default: null
  },
  voiceData: {
    type: String, // Store as Base64 String
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index. Automatically deletes document at expiresAt.
  }
});

// Enforce that text feedback has message and voice feedback has voiceData
studentFeedbackSchema.pre('save', function(next) {
  if (this.type === 'text' && (!this.message || this.message.trim().length === 0)) {
    return next(new Error('Text feedback must contain a message.'));
  }
  if (this.type === 'voice' && !this.voiceData) {
    return next(new Error('Voice feedback must contain audio data.'));
  }
  next();
});

module.exports = mongoose.model('StudentFeedback', studentFeedbackSchema);
