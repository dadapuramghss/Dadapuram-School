const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { verifyStudentToken } = require('../middleware/studentAuth');
const StudentFeedback = require('../models/StudentFeedback');

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
      return res.status(404).json({ message: 'Student account not found' });
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

    // Only 1 student found, require password (DOB)
    const student = students[0];

    res.json({
      requiresPassword: true,
      studentId: student._id,
      studentName: student.name
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/student-portal/login-verify
router.post('/login-verify', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    
    if (!studentId || !password) {
      return res.status(400).json({ message: 'Student ID and Password are required' });
    }

    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student account not found' });
    }

    if (!student.dob) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Verify Password (DOB in DDMMYYYY format)
    let dbDob = String(student.dob).trim();
    if (dbDob.includes('T')) {
      dbDob = dbDob.split('T')[0];
    }
    
    let year, month, day;
    const parts = dbDob.split(/[-/]/);
    
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
      } else if (parts[2].length === 4) {
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
      } else {
        return res.status(401).json({ message: 'Invalid DB DOB Format: ' + dbDob });
      }
    } else {
      return res.status(401).json({ message: 'Invalid DB DOB String: ' + dbDob });
    }

    const expectedPassword1 = `${day}${month}${year}`;
    const expectedPassword2 = `${month}${day}${year}`;

    if (password !== expectedPassword1 && password !== expectedPassword2) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { studentId: student._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Strip sensitive info
    const studentData = student.toObject();
    delete studentData.dob;

    res.json({
      message: 'Login successful',
      token,
      student: studentData
    });
  } catch (error) {
    console.error('Student login-verify error:', error);
    res.status(500).json({ message: 'Server error during login verification' });
  }
});

// GET /api/student-portal/me
router.get('/me', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student.toObject();

    // Calculate class rank for each term
    const peers = await Student.find({ standard: student.standard, section: student.section }).lean();
    
    student.terms = student.terms.map(term => {
      const myScore = term.marks.reduce((sum, m) => sum + m.score, 0);
      let betterStudents = 0;
      let totalAssessed = 0;
      
      peers.forEach(peer => {
        const peerTerm = peer.terms?.find(t => t.termName === term.termName);
        if (peerTerm && peerTerm.marks && peerTerm.marks.length > 0) {
          totalAssessed++;
          const peerScore = peerTerm.marks.reduce((sum, m) => sum + m.score, 0);
          if (peerScore > myScore) {
            betterStudents++;
          }
        }
      });
      
      return {
        ...term,
        rank: betterStudents + 1,
        totalAssessed
      };
    });

    res.json(student);
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
    const circulars = await Circular.find({ audience: { $in: ['All', 'Student'] } }).sort({ createdAt: -1 });
    res.json({ success: true, data: circulars });
  } catch (error) {
    console.error('Error fetching circulars:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student-portal/attendance
router.get('/attendance', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student;
    const Attendance = require('../models/Attendance');

    const attendances = await Attendance.find({
      standard: student.standard,
      section: student.section,
      isSubmitted: true,
      'records.student': student._id
    }).sort({ date: -1, period: 1 });

    const grouped = {};
    attendances.forEach(att => {
      if (!grouped[att.date]) {
        grouped[att.date] = { 
          date: att.date, 
          periods: { 1: '-', 2: '-', 3: '-', 4: '-', 5: '-', 6: '-', 7: '-', 8: '-' } 
        };
      }
      
      const record = att.records.find(r => r.student.toString() === student._id.toString());
      if (record) {
        grouped[att.date].periods[att.period] = record.status === 'Present' ? 'P' : (record.status === 'Absent' ? 'A' : 'L');
      }
    });
    
    const result = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student-portal/materials
router.get('/materials', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student;

    const Material = require('../models/Material');
    const materials = await Material.find({
      standard: student.standard,
      section: student.section
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Error fetching student materials:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// POST /api/student-portal/feedback
router.post('/feedback', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student || req.user;
    const studentId = student?._id || student?.id || req.studentId;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Student identity could not be verified'
      });
    }

    const { type, message, voiceData } = req.body;

    if (!type || !['text', 'voice'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback type. Must be "text" or "voice".'
      });
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day TTL

    const feedbackData = {
      studentId,
      type,
      createdAt,
      expiresAt
    };

    if (type === 'text') {
      const trimmedMessage = String(message || '').trim();
      if (!trimmedMessage || trimmedMessage.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please enter your feedback.'
        });
      }
      if (trimmedMessage.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Feedback cannot exceed 1000 characters.'
        });
      }
      feedbackData.message = trimmedMessage;
      feedbackData.voiceData = null;
    } else if (type === 'voice') {
      if (!voiceData || typeof voiceData !== 'string' || voiceData.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Voice recording data is required.'
        });
      }

      // Check Base64 payload size (maximum 5 MB binary data)
      const base64Data = voiceData.includes('base64,') ? voiceData.split('base64,')[1] : voiceData;
      const sizeInBytes = (base64Data.length * 3) / 4;
      const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

      if (sizeInBytes > maxSizeBytes) {
        return res.status(400).json({
          success: false,
          message: 'Voice recording is too large.'
        });
      }

      feedbackData.message = null;
      feedbackData.voiceData = voiceData;
    }

    const feedback = new StudentFeedback(feedbackData);
    await feedback.save();

    return res.status(201).json({
      success: true,
      message: type === 'voice' ? 'Voice feedback sent successfully.' : 'Feedback sent successfully.'
    });
  } catch (error) {
    console.error('Student feedback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to send feedback. Please try again.'
    });
  }
});

module.exports = router;
