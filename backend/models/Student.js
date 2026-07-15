const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  subject: { 
    type: String, 
    required: true,
    trim: true
  },
  score: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  }
}, { _id: false });

const termSchema = new mongoose.Schema({
  termName: { 
    type: String, 
    enum: ['Quarterly', 'Half-Yearly', 'Annual'], 
    required: true 
  },
  marks: [markSchema]
}, { _id: false });

const studentSchema = new mongoose.Schema({
  rollNumber: { 
    type: String, 
    required: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  standard: { 
    type: String, 
    required: true,
    enum: ['6', '7', '8', '9', '10', '11', '12'],
    trim: true
  },
  section: { 
    type: String, 
    required: true,
    enum: ['A', 'B', 'C', 'D'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Other'
  },
  medium: {
    type: String,
    required: true,
    enum: ['TAMIL', 'ENGLISH'],
    trim: true
  },
  photoUrl: { 
    type: String,
    trim: true,
    default: null
  },
  tamilName: {
    type: String,
    trim: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  dob: {
    type: String,
    trim: true
  },
  admissionNumber: {
    type: String,
    trim: true
  },
  religion: {
    type: String,
    trim: true
  },
  community: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  terms: [termSchema]
}, { 
  timestamps: true 
});

// Ensure unique roll number per standard and section
studentSchema.index({ standard: 1, section: 1, rollNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
