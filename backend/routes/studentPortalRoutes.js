const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { verifyStudentToken } = require('../middleware/studentAuth');

const JWT_SECRET = process.env.JWT_SECRET || 'edupulse_student_secret_key_2026';

// POST /api/student-portal/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, mobileNumber } = req.body;
    const loginId = identifier || mobileNumber;

    if (!loginId) {
      return res.status(400).json({ message: 'Mobile number or EMIS number is required' });
    }

    const students = await Student.find({
      $or: [
        { mobileNumber: loginId },
        { emisNumber: loginId }
      ]
    });

    if (!students || students.length === 0) {
      return res.status(404).json({ message: 'Student not found with this Mobile or EMIS number' });
    }

    if (students.length > 1) {
      // Multiple students share this number (e.g. siblings)
      const mappedStudents = students.map(s => ({
        _id: s._id,
        name: s.name,
        standard: s.standard,
        section: s.section,
        emisNumber: s.emisNumber
      }));
      return res.json({ requiresSelection: true, students: mappedStudents });
    }

    // Only 1 student found, log them in directly
    const student = students[0];

    // Generate JWT
    const token = jwt.sign(
      { studentId: student._id },
      JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    res.json({
      message: 'Login successful',
      token,
      student
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/student-portal/login-select
router.post('/login-select', async (req, res) => {
  try {
    const { identifier, mobileNumber, studentId } = req.body;
    const loginId = identifier || mobileNumber;
    
    if (!loginId || !studentId) {
      return res.status(400).json({ message: 'Login ID and student ID are required' });
    }

    const student = await Student.findOne({ 
      _id: studentId,
      $or: [
        { mobileNumber: loginId },
        { emisNumber: loginId }
      ]
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Invalid selection or student not found' });
    }

    // Generate JWT
    const token = jwt.sign(
      { studentId: student._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      student
    });
  } catch (error) {
    console.error('Student login-select error:', error);
    res.status(500).json({ message: 'Server error during login selection' });
  }
});

// GET /api/student-portal/me
router.get('/me', verifyStudentToken, async (req, res) => {
  try {
    // req.student is populated by verifyStudentToken middleware
    res.json(req.student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student-portal/homework
router.get('/homework', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student;

    const Homework = require('../models/Homework');
    const homeworkList = await Homework.find({
      standard: student.standard,
      section: student.section
    }).sort({ dueDate: 1 });

    res.json({ success: true, data: homeworkList });
  } catch (error) {
    console.error('Error fetching homework:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student-portal/circulars
router.get('/circulars', verifyStudentToken, async (req, res) => {
  try {
    const Circular = require('../models/Circular');
    const circulars = await Circular.find().sort({ createdAt: -1 });
    res.json({ success: true, data: circulars });
  } catch (error) {
    console.error('Error fetching circulars:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
