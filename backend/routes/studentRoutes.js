const express = require('express');
const router = express.Router();
const { addStudent, getStudentsByClass, getStudentById, updateStudentMarks, updateStudent, deleteStudent } = require('../controllers/studentController');
const { verifyToken } = require('../middleware/auth');

// All student routes require authentication
router.use(verifyToken);

router.post('/', addStudent);
router.get('/', getStudentsByClass);
router.get('/:studentId', getStudentById);
router.put('/:studentId/marks', updateStudentMarks);
router.put('/:studentId', updateStudent);
router.delete('/:studentId', deleteStudent);

module.exports = router;
