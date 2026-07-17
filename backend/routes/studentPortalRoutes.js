const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { verifyStudentToken } = require('../middleware/studentAuth');

const JWT_SECRET = process.env.JWT_SECRET || 'edupulse_student_secret_key_2026';

// POST /api/student-portal/login
router.post('/login', async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    const student = await Student.findOne({ mobileNumber });

    if (!student) {
      return res.status(404).json({ message: 'Student not found with this mobile number' });
    }

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

// GET /api/student-portal/me
router.get('/me', verifyStudentToken, async (req, res) => {
  try {
    // req.student is populated by verifyStudentToken middleware
    res.json(req.student);
  } catch (error) {
    console.error('Fetch student profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

module.exports = router;
