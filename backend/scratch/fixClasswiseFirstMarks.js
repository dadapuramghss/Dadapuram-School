const fs = require('fs');

let code = fs.readFileSync('controllers/analyticsController.js', 'utf8');

const oldPipeline = `    const classwiseFirstMarks = await Student.aggregate([
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
                  { $in: ["$$this.subject", "$$value.subject"] },
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
      { $sort: { totalScore: -1 } },
      {
        $group: {
          _id: {
            standard: "$_id.standard",
            section: "$_id.section",
            termName: "$_id.termName"
          },
          topStudent: { $first: "$_id.name" },
          topScore: { $first: "$totalScore" }
        }
      },
      { $sort: { "_id.standard": 1, "_id.section": 1, "_id.termName": 1 } }
    ]);`;

const newPipeline = `    const classwiseFirstMarks = await Student.aggregate([
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
                  { $in: ["$$this.subject", "$$value.subject"] },
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
    ]);`;

if (code.includes(oldPipeline)) {
    code = code.replace(oldPipeline, newPipeline);
    fs.writeFileSync('controllers/analyticsController.js', code);
    console.log("Successfully replaced classwiseFirstMarks pipeline.");
} else {
    console.log("Error: Could not find old pipeline text.");
}
