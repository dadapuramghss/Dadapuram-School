const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  addHomework,
  updateHomework,
  getHomeworkByClass,
  deleteHomework
} = require('../controllers/homeworkController');

// All routes require authentication
router.use(verifyToken);

// Get homework for a specific class
router.get('/', getHomeworkByClass);

// Add new homework
router.post('/', addHomework);

// Update existing homework
router.put('/:homeworkId', updateHomework);

// Delete homework
router.delete('/:homeworkId', deleteHomework);

module.exports = router;
