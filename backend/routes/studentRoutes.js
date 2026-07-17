const express = require('express');
const router = express.Router();
const { addStudent, getStudentsByClass, getStudentById, updateStudentMarks, updateStudent, deleteStudent, bulkAddStudents } = require('../controllers/studentController');
const { verifyToken } = require('../middleware/auth');

// All student routes require authentication
router.use(verifyToken);

router.post('/bulk', bulkAddStudents);
router.post('/', addStudent);
router.get('/', getStudentsByClass);
router.get('/:studentId', getStudentById);
router.put('/:studentId/marks', updateStudentMarks);
router.put('/:studentId', updateStudent);
router.delete('/:studentId', deleteStudent);

module.exports = router;
