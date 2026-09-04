const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const StudentFeedback = require('../models/StudentFeedback');

// GET /api/feedback
// Get all active feedback (for admins)
router.get('/', verifyToken, async (req, res) => {
  try {
    // We explicitly filter where expiresAt is strictly in the future,
    // providing a safety net if MongoDB TTL hasn't run yet.
    const feedbackList = await StudentFeedback.find({
      expiresAt: { $gt: new Date() }
    })
      .populate('studentId', 'name emisNumber standard section mobileNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: feedbackList });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: 'Server error fetching feedback' });
  }
});

// DELETE /api/feedback/:id
// Delete a feedback record
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await StudentFeedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    // Because voiceData is stored as a base64 string directly in the MongoDB document,
    // deleting the document automatically removes the audio data.
    await StudentFeedback.findByIdAndDelete(id);

    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ success: false, message: 'Server error deleting feedback' });
  }
});

module.exports = router;
