const express = require('express');
const router = express.Router();
const { addStudent, getStudentsByClass, getStudentById, updateStudentMarks, bulkUpdateMarks, updateStudent, deleteStudent, bulkAddStudents, bulkDeleteStudents, fixDbIndex, fixSubjects } = require('../controllers/studentController');

// Public route to fix DB indexes
router.get('/fix-db-index', fixDbIndex);

// Public route to fix subjects
router.get('/fix-subjects', fixSubjects);

const { verifyToken } = require('../middleware/auth');

// All student routes below require authentication
router.use(verifyToken);

router.post('/bulk', bulkAddStudents);
router.post('/bulk-marks', bulkUpdateMarks);
router.post('/bulk-delete', bulkDeleteStudents);
router.post('/', addStudent);
router.get('/', getStudentsByClass);
router.get('/:studentId', getStudentById);
router.put('/:studentId/marks', updateStudentMarks);
router.put('/:studentId', updateStudent);
router.delete('/:studentId', deleteStudent);

module.exports = router;
