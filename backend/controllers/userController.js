const User = require('../models/User');

// POST /api/users/activity/heartbeat
exports.recordHeartbeat = async (req, res) => {
  try {
    const { uid } = req.user;
    const { activeStandard, activeSection } = req.body;
    
    await User.findOneAndUpdate(
      { uid },
      { 
        $set: { 
          lastActivityAt: new Date(),
          activeStandard: activeStandard || null,
          activeSection: activeSection || null
        } 
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording heartbeat:', error);
    res.status(500).json({ message: 'Server error recording heartbeat' });
  }
};

// GET /api/users/activity
// Admin only
exports.getActivity = async (req, res) => {
  try {
    if (!req.dbUser || req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    
    const users = await User.find({}, {
      name: 1,
      email: 1,
      role: 1,
      loginCount: 1,
      lastLoginAt: 1,
      lastActivityAt: 1,
      activeStandard: 1,
      activeSection: 1,
      isActive: 1
    }).sort({ lastActivityAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
