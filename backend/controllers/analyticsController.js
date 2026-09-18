const Student = require('../models/Student');
const User = require('../models/User');

/**
 * Fetch a class-wise leaderboard (sorted top to bottom by total marks).
 * Uses MongoDB Aggregation Framework to calculate total marks and assign ranks.
 */
const getClassLeaderboard = async (req, res) => {
  try {
    const { standard, section, rankBy = 'Marks' } = req.query;
    
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
          emisNumber: { $first: "$emisNumber" },
          name: { $first: "$name" },
          photoUrl: { $first: "$photoUrl" },
          standard: { $first: "$standard" },
          section: { $first: "$section" },
          totalMarks: {
            $sum: "$terms.marks.score"
          },
          termsSet: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$terms.termName", null] },
                    { $ne: ["$terms.marks", null] },
                    { $ne: ["$terms.marks.score", null] }
                  ]
                },
                "$terms.termName",
                "$$REMOVE"
              ]
            }
          }
        }
      },
      // 5. Lookup ClassConfig to dynamically determine expected subjects
      {
        $lookup: {
          from: "classconfigs",
          let: { std: "$standard", sec: "$section" },
          pipeline: [
            { $match:
               { $expr:
                  { $and:
                     [
                       { $eq: [ "$standard",  "$std" ] },
                       { $eq: [ "$section", "$sec" ] }
                     ]
                  }
               }
            }
          ],
          as: "config"
        }
      },
      {
        $addFields: {
          config: { $arrayElemAt: ["$config", 0] },
          termsCount: { $size: "$termsSet" }
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: { $size: { $ifNull: ["$config.subjects", []] } }
        }
      },
      // Fallback to standard assumptions if config is missing or empty
      {
        $addFields: {
          expectedSubjectsCount: {
            $cond: [
              { $gt: ["$expectedSubjectsCount", 0] },
              "$expectedSubjectsCount",
              {
                $switch: {
                  branches: [
                    { case: { $in: ["$standard", ["11", "12"]] }, then: 6 },
                    { case: { $in: ["$standard", ["6", "7", "8", "9", "10"]] }, then: 5 }
                  ],
                  default: 5
                }
              }
            ]
          }
        }
      },
      {
        $addFields: {
          maximumMarks: { $multiply: ["$termsCount", "$expectedSubjectsCount", 100] }
        }
      },
      {
        $addFields: {
          percentage: {
            $round: [
              { $cond: [ { $gt: ["$maximumMarks", 0] }, { $multiply: [ { $divide: ["$totalMarks", "$maximumMarks"] }, 100 ] }, 0 ] },
              2
            ]
          }
        }
      },
      // 6. Use $setWindowFields to calculate rank
      {
        $setWindowFields: {
          sortBy: rankBy === 'Percentage' ? { percentage: -1 } : { totalMarks: -1 },
          output: {
            rank: {
              $denseRank: {}
            }
          }
        }
      },
      // 7. Sort by rank to return leaderboard top-to-bottom
      {
        $sort: {
          rank: 1,
          name: 1
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
          emisNumber: { $first: "$emisNumber" },
          name: { $first: "$name" },
          standard: { $first: "$standard" },
          section: { $first: "$section" },
          gender: { $first: "$gender" },
          totalMarks: { $sum: "$terms.marks.score" },
          termsSet: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$terms.termName", null] },
                    { $ne: ["$terms.marks", null] },
                    { $gt: ["$terms.marks.score", 0] }
                  ]
                },
                "$terms.termName",
                "$$REMOVE"
              ]
            }
          }
        }
      },
      {
        $match: {
          standard: { $in: ["6", "7", "8", "9", "10", "11", "12"] }
        }
      },
      {
        $lookup: {
          from: "classconfigs",
          let: { std: "$standard", sec: "$section" },
          pipeline: [
            { $match:
               { $expr:
                  { $and:
                     [
                       { $eq: [ "$standard",  "$$std" ] },
                       { $eq: [ "$section", "$$sec" ] }
                     ]
                  }
               }
            }
          ],
          as: "config"
        }
      },
      {
        $addFields: {
          config: { $arrayElemAt: ["$config", 0] },
          termsCount: { $size: "$termsSet" }
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: { $size: { $ifNull: ["$config.subjects", []] } }
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: {
            $cond: [
              { $gt: ["$expectedSubjectsCount", 0] },
              "$expectedSubjectsCount",
              {
                $switch: {
                  branches: [
                    { case: { $in: ["$standard", ["11", "12"]] }, then: 6 },
                    { case: { $in: ["$standard", ["6", "7", "8", "9", "10"]] }, then: 5 }
                  ],
                  default: 5
                }
              }
            ]
          }
        }
      },
      {
        $addFields: {
          maximumMarks: {
            $cond: [
              { $gt: ["$termsCount", 0] },
              { $multiply: ["$termsCount", "$expectedSubjectsCount", 100] },
              null
            ]
          }
        }
      },
      {
        $match: { maximumMarks: { $gt: 0 } }
      },
      {
        $addFields: {
          percentage: {
            $round: [
              { $multiply: [ { $divide: ["$totalMarks", "$maximumMarks"] }, 100 ] },
              2
            ]
          },
          genderPriority: {
            $switch: {
              branches: [
                { case: { $eq: ["$gender", "Male"] }, then: 1 },
                { case: { $eq: ["$gender", "Female"] }, then: 2 }
              ],
              default: 3
            }
          }
        }
      },
      {
        $sort: { percentage: -1, totalMarks: -1, genderPriority: 1, name: 1 }
      },
      {
        $limit: 3
      }
    ]);

    const top12Students = await Student.aggregate([
      {
        $match: { ...query, standard: '12' }
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
          emisNumber: { $first: "$emisNumber" },
          name: { $first: "$name" },
          standard: { $first: "$standard" },
          section: { $first: "$section" },
          gender: { $first: "$gender" },
          totalMarks: { $sum: "$terms.marks.score" },
          termsSet: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$terms.termName", null] },
                    { $ne: ["$terms.marks", null] },
                    { $gt: ["$terms.marks.score", 0] }
                  ]
                },
                "$terms.termName",
                "$$REMOVE"
              ]
            }
          }
        }
      },
      {
        $match: {
          standard: { $in: ["6", "7", "8", "9", "10", "11", "12"] }
        }
      },
      {
        $lookup: {
          from: "classconfigs",
          let: { std: "$standard", sec: "$section" },
          pipeline: [
            { $match:
               { $expr:
                  { $and:
                     [
                       { $eq: [ "$standard",  "$$std" ] },
                       { $eq: [ "$section", "$$sec" ] }
                     ]
                  }
               }
            }
          ],
          as: "config"
        }
      },
      {
        $addFields: {
          config: { $arrayElemAt: ["$config", 0] },
          termsCount: { $size: "$termsSet" }
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: { $size: { $ifNull: ["$config.subjects", []] } }
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: {
            $cond: [
              { $gt: ["$expectedSubjectsCount", 0] },
              "$expectedSubjectsCount",
              {
                $switch: {
                  branches: [
                    { case: { $in: ["$standard", ["11", "12"]] }, then: 6 },
                    { case: { $in: ["$standard", ["6", "7", "8", "9", "10"]] }, then: 5 }
                  ],
                  default: 5
                }
              }
            ]
          }
        }
      },
      {
        $addFields: {
          maximumMarks: {
            $cond: [
              { $gt: ["$termsCount", 0] },
              { $multiply: ["$termsCount", "$expectedSubjectsCount", 100] },
              null
            ]
          }
        }
      },
      {
        $match: { maximumMarks: { $gt: 0 } }
      },
      {
        $addFields: {
          percentage: {
            $round: [
              { $multiply: [ { $divide: ["$totalMarks", "$maximumMarks"] }, 100 ] },
              2
            ]
          },
          genderPriority: {
            $switch: {
              branches: [
                { case: { $eq: ["$gender", "Male"] }, then: 1 },
                { case: { $eq: ["$gender", "Female"] }, then: 2 }
              ],
              default: 3
            }
          }
        }
      },
      {
        $sort: { percentage: -1, totalMarks: -1, genderPriority: 1, name: 1 }
      },
      {
        $limit: 3
      }
    ]);

    const top10Students = await Student.aggregate([
      {
        $match: { ...query, standard: '10' }
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
          emisNumber: { $first: "$emisNumber" },
          name: { $first: "$name" },
          standard: { $first: "$standard" },
          section: { $first: "$section" },
          gender: { $first: "$gender" },
          totalMarks: { $sum: "$terms.marks.score" },
          termsSet: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$terms.termName", null] },
                    { $ne: ["$terms.marks", null] },
                    { $gt: ["$terms.marks.score", 0] }
                  ]
                },
                "$terms.termName",
                "$$REMOVE"
              ]
            }
          }
        }
      },
      {
        $match: {
          standard: { $in: ["6", "7", "8", "9", "10", "11", "12"] }
        }
      },
      {
        $lookup: {
          from: "classconfigs",
          let: { std: "$standard", sec: "$section" },
          pipeline: [
            { $match:
               { $expr:
                  { $and:
                     [
                       { $eq: [ "$standard",  "$$std" ] },
                       { $eq: [ "$section", "$$sec" ] }
                     ]
                  }
               }
            }
          ],
          as: "config"
        }
      },
      {
        $addFields: {
          config: { $arrayElemAt: ["$config", 0] },
          termsCount: { $size: "$termsSet" }
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: { $size: { $ifNull: ["$config.subjects", []] } }
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: {
            $cond: [
              { $gt: ["$expectedSubjectsCount", 0] },
              "$expectedSubjectsCount",
              {
                $switch: {
                  branches: [
                    { case: { $in: ["$standard", ["11", "12"]] }, then: 6 },
                    { case: { $in: ["$standard", ["6", "7", "8", "9", "10"]] }, then: 5 }
                  ],
                  default: 5
                }
              }
            ]
          }
        }
      },
      {
        $addFields: {
          maximumMarks: {
            $cond: [
              { $gt: ["$termsCount", 0] },
              { $multiply: ["$termsCount", "$expectedSubjectsCount", 100] },
              null
            ]
          }
        }
      },
      {
        $match: { maximumMarks: { $gt: 0 } }
      },
      {
        $addFields: {
          percentage: {
            $round: [
              { $multiply: [ { $divide: ["$totalMarks", "$maximumMarks"] }, 100 ] },
              2
            ]
          },
          genderPriority: {
            $switch: {
              branches: [
                { case: { $eq: ["$gender", "Male"] }, then: 1 },
                { case: { $eq: ["$gender", "Female"] }, then: 2 }
              ],
              default: 3
            }
          }
        }
      },
      {
        $sort: { percentage: -1, totalMarks: -1, genderPriority: 1, name: 1 }
      },
      {
        $limit: 3
      }
    ]);


    // Students Abstract Pipeline (Total, Male, Female by class/section)
    const studentsAbstract = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: { standard: "$standard", section: "$section" },
          totalStudents: { $sum: 1 },
          maleStudents: { $sum: { $cond: [{ $eq: ["$gender", "Male"] }, 1, 0] } },
          femaleStudents: { $sum: { $cond: [{ $eq: ["$gender", "Female"] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          standardOrder: {
            $convert: { input: "$_id.standard", to: "int", onError: 999, onNull: 999 }
          }
        }
      },
      { $sort: { standardOrder: 1, "_id.section": 1 } },
      { $project: { standardOrder: 0 } }
    ]);

    // Classwise First Mark Pipeline (Highest total score by term, per class/section)
    const classwiseFirstMarks = await Student.aggregate([
      { $match: query },
      { $unwind: { path: "$terms", preserveNullAndEmptyArrays: false } },
      // Deduplicate subject marks within each term (keep first occurrence)
      {
        $addFields: {
          "terms.marks": {
            $reduce: {
              input: { $ifNull: ["$terms.marks", []] },
              initialValue: [],
              in: {
                $cond: [
                  { $in: ["$$this.subject", { $ifNull: ["$$value.subject", []] }] },
                  "$$value",
                  { $concatArrays: ["$$value", ["$$this"]] }
                ]
              }
            }
          }
        }
      },
      { $unwind: { path: "$terms.marks", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: {
            studentId: "$_id",
            standard: "$standard",
            section: "$section",
            termName: "$terms.termName",
            name: "$name"
          },
          totalScore: { $sum: "$terms.marks.score" }
        }
      },
      {
        $lookup: {
          from: "classconfigs",
          let: { std: "$_id.standard", sec: "$_id.section" },
          pipeline: [
            { $match:
               { $expr:
                  { $and:
                     [
                       { $eq: [ "$standard",  "$std" ] },
                       { $eq: [ "$section", "$sec" ] }
                     ]
                  }
               }
            }
          ],
          as: "config"
        }
      },
      {
        $addFields: {
          config: { $arrayElemAt: ["$config", 0] },
          termsCount: 1
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: { $size: { $ifNull: ["$config.subjects", []] } }
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: {
            $cond: [
              { $gt: ["$expectedSubjectsCount", 0] },
              "$expectedSubjectsCount",
              {
                $switch: {
                  branches: [
                    { case: { $in: ["$_id.standard", ["11", "12"]] }, then: 6 },
                    { case: { $in: ["$_id.standard", ["6", "7", "8", "9", "10"]] }, then: 5 }
                  ],
                  default: 5
                }
              }
            ]
          }
        }
      },
      {
        $addFields: {
          maximumMarks: {
            $multiply: ["$termsCount", "$expectedSubjectsCount", 100]
          }
        }
      },
      {
        $match: { maximumMarks: { $gt: 0 } }
      },
      {
        $addFields: {
          percentage: {
            $round: [
              { $multiply: [ { $divide: ["$totalScore", "$maximumMarks"] }, 100 ] },
              2
            ]
          }
        }
      },
      { $sort: { percentage: -1, totalScore: -1, "_id.name": 1 } },
      {
        $group: {
          _id: {
            standard: "$_id.standard",
            section: "$_id.section",
            termName: "$_id.termName"
          },
          studentId: { $first: "$_id.studentId" },
          topStudent: { $first: "$_id.name" },
          topScore: { $first: "$totalScore" },
          maximumMarks: { $first: "$maximumMarks" },
          percentage: { $first: "$percentage" }
        }
      },
      { $sort: { "_id.standard": 1, "_id.section": 1, "_id.termName": 1 } }
    ]);

    // All Exams First Marks Pipeline (Highest overall score across all exams, per class/section)
    const allExamsFirstMarks = await Student.aggregate([
      { $match: query },
      { $unwind: { path: "$terms", preserveNullAndEmptyArrays: false } },
      // Deduplicate subject marks within each term (keep first occurrence)
      {
        $addFields: {
          "terms.marks": {
            $reduce: {
              input: { $ifNull: ["$terms.marks", []] },
              initialValue: [],
              in: {
                $cond: [
                  { $in: ["$$this.subject", { $ifNull: ["$$value.subject", []] }] },
                  "$$value",
                  { $concatArrays: ["$$value", ["$$this"]] }
                ]
              }
            }
          }
        }
      },
      { $unwind: { path: "$terms.marks", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: {
            studentId: "$_id",
            standard: "$standard",
            section: "$section",
            name: "$name"
          },
          totalScore: { $sum: "$terms.marks.score" },
          termsSet: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$terms.termName", null] },
                    { $ne: ["$terms.marks", null] },
                    { $gt: ["$terms.marks.score", 0] }
                  ]
                },
                "$terms.termName",
                "$$REMOVE"
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "classconfigs",
          let: { std: "$_id.standard", sec: "$_id.section" },
          pipeline: [
            { $match:
               { $expr:
                  { $and:
                     [
                       { $eq: [ "$standard",  "$std" ] },
                       { $eq: [ "$section", "$sec" ] }
                     ]
                  }
               }
            }
          ],
          as: "config"
        }
      },
      {
        $addFields: {
          config: { $arrayElemAt: ["$config", 0] },
          termsCount: { $size: "$termsSet" }
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: { $size: { $ifNull: ["$config.subjects", []] } }
        }
      },
      {
        $addFields: {
          expectedSubjectsCount: {
            $cond: [
              { $gt: ["$expectedSubjectsCount", 0] },
              "$expectedSubjectsCount",
              {
                $switch: {
                  branches: [
                    { case: { $in: ["$_id.standard", ["11", "12"]] }, then: 6 },
                    { case: { $in: ["$_id.standard", ["6", "7", "8", "9", "10"]] }, then: 5 }
                  ],
                  default: 5
                }
              }
            ]
          }
        }
      },
      {
        $addFields: {
          maximumMarks: {
            $cond: [
              { $gt: ["$termsCount", 0] },
              { $multiply: ["$termsCount", "$expectedSubjectsCount", 100] },
              null
            ]
          }
        }
      },
      {
        $match: { maximumMarks: { $gt: 0 } }
      },
      {
        $addFields: {
          percentage: {
            $round: [
              { $multiply: [ { $divide: ["$totalScore", "$maximumMarks"] }, 100 ] },
              2
            ]
          }
        }
      },
      { $sort: { percentage: -1, totalScore: -1, "_id.name": 1 } },
      {
        $group: {
          _id: {
            standard: "$_id.standard",
            section: "$_id.section"
          },
          studentId: { $first: "$_id.studentId" },
          topStudent: { $first: "$_id.name" },
          topScore: { $first: "$totalScore" },
          maximumMarks: { $first: "$maximumMarks" },
          percentage: { $first: "$percentage" }
        }
      },
      { $sort: { "_id.standard": 1, "_id.section": 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        maleStudents,
        femaleStudents,
        totalTeachers,
        topStudents,
        top12Students,
        top10Students,
        studentsAbstract,
        classwiseFirstMarks,
        allExamsFirstMarks
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
