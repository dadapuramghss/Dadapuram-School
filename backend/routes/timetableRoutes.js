const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

const verifyAdmin = (req, res, next) => {
  if (!req.dbUser || req.dbUser.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  next();
};

const verifyAdminOrSelf = (req, res, next) => {
  // Wait, getTimetable handles logic in controller. 
  // If teacher, they should only query their own teacherId or it's implicitly filtered.
  // We'll filter in the controller, but let's allow teachers to access GET.
  next();
};

router.get('/', verifyAdminOrSelf, timetableController.getTimetable);
router.get('/readiness', verifyAdmin, timetableController.checkReadiness);
router.post('/generate', verifyAdmin, timetableController.generateTimetable);
router.post('/validate', verifyAdmin, timetableController.validateChange);
router.post('/publish', verifyAdmin, timetableController.publishTimetable);
router.put('/:id', verifyAdmin, timetableController.updateTimetableSlot);

module.exports = router;
