const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// All activity routes require a valid Firebase JWT
router.use(verifyToken);

router.post('/activity/heartbeat', userController.recordHeartbeat);
router.get('/activity', userController.getActivity);

module.exports = router;
