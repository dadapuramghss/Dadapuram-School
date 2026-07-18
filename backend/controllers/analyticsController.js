const Student = require('../models/Student');
const User = require('../models/User');

/**
 * Fetch a class-wise leaderboard (sorted top to bottom by total marks).
 * Uses MongoDB Aggregation Framework to calculate total marks and assign ranks.
 */
const getClassLeaderboard = async (req, res) => {
  try {
    const { standard, section } = req.query;
    
    if (!standard || !section) {
      return res.status(400).json({ error: 'Standard and section are required parameters' });
    }

    const matchStage = {};
    if (standard !== 'All') matchStage.standard = standard;
    if (section !== 'All') matchStage.section = section;

    const leaderboard = await Student.aggregate([
      // 1. Filter students dynamically
      {
        $match: matchStage
      },
      // 2. Unwind terms to access marks
      {
        $unwind: {
          path: "$terms",
          preserveNullAndEmptyArrays: true
        }
      },
      // 3. Unwind marks to access individual subject scores
      {
        $unwind: {
          path: "$terms.marks",
          preserveNullAndEmptyArrays: true
        }
      },
      // 4. Group by student to calculate total cumulative marks
      {
        $group: {
          _id: "$_id",
          rollNumber: { $first: "$rollNumber" },
          name: { $first: "$name" },
          photoUrl: { $first: "$photoUrl" },
          standard: { $first: "$standard" },
          section: { $first: "$section" },
          totalMarks: {
            $sum: "$terms.marks.score"
          }
        }
      },
      // 5. Use $setWindowFields to calculate rank based on totalMarks (highest to lowest)
      {
        $setWindowFields: {
          sortBy: { totalMarks: -1 },
          output: {
            rank: {
              $denseRank: {}
            }
          }
        }
      },
      // 6. Sort by rank to return leaderboard top-to-bottom
      {
        $sort: {
          rank: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: leaderboard
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    let query = {};
    if (req.dbUser && req.dbUser.role === 'teacher') {
      if (req.dbUser.assignedClasses && req.dbUser.assignedClasses.length > 0) {
        query = {
          $or: req.dbUser.assignedClasses.map(c => ({
            standard: c.standard,
            section: c.section
          }))
        };
      } else {
        // If teacher has no classes assigned, they have 0 students
        query = { _id: null };
      }
    }

    const totalStudents = await Student.countDocuments(query);
    const maleStudents = await Student.countDocuments({ ...query, gender: 'Male' });
    const femaleStudents = await Student.countDocuments({ ...query, gender: 'Female' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    // Get Top 3 students across the school (or teacher's classes)
    const topStudents = await Student.aggregate([
      {
        $match: query
      },
      {
        $unwind: {
          path: "$terms",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$terms.marks",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$_id",
          rollNumber: { $first: "$rollNumber" },
          name: { $first: "$name" },
          standard: { $first: "$standard" },
          section: { $first: "$section" },
          totalMarks: { $sum: "$terms.marks.score" }
        }
      },
      {
        $sort: { totalMarks: -1 }
      },
      {
        $limit: 3
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        maleStudents,
        femaleStudents,
        totalTeachers,
        topStudents
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getClassLeaderboard,
  getDashboardStats
};
