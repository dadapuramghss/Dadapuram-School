const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../controllers/analyticsController.js');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Leaderboard Update
const leaderboardOld = `          termsSet: {
            $addToSet: {
              $cond: [ { $ne: ["$terms.termName", null] }, "$terms.termName", "$$REMOVE" ]
            }
          }
        }
      },
      // 5. Add percentage and maximumMarks based on number of terms and standard
      {
        $addFields: {
          termsCount: { $size: "$termsSet" },
          standardMaxMarks: {
            $switch: {
              branches: [
                { case: { $in: ["$standard", ["11", "12"]] }, then: 600 },
                { case: { $in: ["$standard", ["6", "7", "8", "9", "10"]] }, then: 500 }
              ],
              default: 500
            }
          }
        }
      },
      {
        $addFields: {
          maximumMarks: { $multiply: ["$termsCount", "$standardMaxMarks"] }
        }
      },`;

const leaderboardNew = `          termsSet: {
            $addToSet: {
              $cond: [ { $ne: ["$terms.termName", null] }, "$terms.termName", "$$REMOVE" ]
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
      },`;

content = content.replace(leaderboardOld, leaderboardNew);

// 2. Dashboard Top Students (3 instances: topStudents, top12Students, top10Students)
const dashGroupOld = `          standard: { $first: "$standard" },
          section: { $first: "$section" },
          gender: { $first: "$gender" },
          totalMarks: { $sum: "$terms.marks.score" }
        }
      },
      {
        $match: {
          standard: { $in: ["6", "7", "8", "9", "10", "11", "12"] }
        }
      },
      {
        $addFields: {
          maximumMarks: {
            $switch: {
              branches: [
                { case: { $in: ["$standard", ["11", "12"]] }, then: 600 },
                { case: { $in: ["$standard", ["6", "7", "8", "9", "10"]] }, then: 500 }
              ],
              default: null
            }
          }
        }
      },`;

const dashGroupNew = `          standard: { $first: "$standard" },
          section: { $first: "$section" },
          gender: { $first: "$gender" },
          totalMarks: { $sum: "$terms.marks.score" },
          termsSet: {
            $addToSet: {
              $cond: [ { $ne: ["$terms.termName", null] }, "$terms.termName", "$$REMOVE" ]
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
      },`;

content = content.split(dashGroupOld).join(dashGroupNew);

// 3. allExamsFirstMarks
const allExamsOld = `          name: "$name"
          },
          totalScore: { $sum: "$terms.marks.score" }
        }
      },
      {
        $addFields: {
          maximumMarks: {
            $switch: {
              branches: [
                { case: { $in: ["$_id.standard", ["11", "12"]] }, then: 600 },
                { case: { $in: ["$_id.standard", ["6", "7", "8", "9", "10"]] }, then: 500 }
              ],
              default: null
            }
          }
        }
      },`;

const allExamsNew = `          name: "$name"
          },
          totalScore: { $sum: "$terms.marks.score" },
          termsSet: {
            $addToSet: {
              $cond: [ { $ne: ["$terms.termName", null] }, "$terms.termName", "$$REMOVE" ]
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
      },`;

content = content.replace(allExamsOld, allExamsNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update completed successfully.');
