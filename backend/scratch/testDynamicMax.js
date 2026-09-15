require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Student = require('../models/Student');
const ClassConfig = require('../models/ClassConfig');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
    try {
        const testDeduplication = await Student.aggregate([
          { $match: { "terms.0": { $exists: true } } },
          { $unwind: { path: "$terms", preserveNullAndEmptyArrays: true } },
          // Deduplicate subject marks within each term
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
          { $unwind: { path: "$terms.marks", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$_id",
              emisNumber: { $first: "$emisNumber" },
              name: { $first: "$name" },
              standard: { $first: "$standard" },
              section: { $first: "$section" },
              totalMarks: { $sum: "$terms.marks.score" },
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
          { $sort: { totalMarks: -1 } },
          { $limit: 3 }
        ]);
        console.log(JSON.stringify(testDeduplication, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
