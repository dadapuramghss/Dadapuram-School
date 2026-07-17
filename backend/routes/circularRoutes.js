const express = require('express');
const router = express.Router();
const Circular = require('../models/Circular');
const { verifyToken } = require('../middleware/auth');

// Add a circular (Admin only, but we'll check role if possible)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, fileUrl, fileType, fileName } = req.body;
    
    // In a real app, verify req.dbUser.role === 'admin'
    // For now, allow anyone who reaches this via the Admin UI

    const newCircular = new Circular({
      title,
      description,
      fileUrl,
      fileType,
      fileName,
      postedBy: req.dbUser ? req.dbUser.name : 'Admin'
    });

    await newCircular.save();
    res.status(201).json({ success: true, data: newCircular });
  } catch (error) {
    console.error('Error adding circular:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all active circulars
router.get('/', verifyToken, async (req, res) => {
  try {
    const circulars = await Circular.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: circulars });
  } catch (error) {
    console.error('Error fetching circulars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a circular
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await Circular.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Circular deleted successfully' });
  } catch (error) {
    console.error('Error deleting circular:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
