const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');

// All routes here require token authentication
router.use(verifyToken);

// Storage Usage monitoring endpoint
router.get('/storage-usage', adminController.getStorageUsage);

module.exports = router;
