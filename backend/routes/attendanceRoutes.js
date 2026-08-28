const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/summary', attendanceController.getAttendanceSummary);
router.get('/', attendanceController.getAttendance);
router.post('/', attendanceController.saveAttendance);

module.exports = router;
