require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Student = require('../models/Student');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
    try {
        const testDeduplication = await Student.aggregate([
          { $match: { "terms.0": { $exists: true } } },
          { $limit: 1 },
          {
            $addFields: {
              "terms": [
                {
                  termName: "Term 1",
                  marks: [
                    { subject: "Math", score: 90 },
                    { subject: "English", score: 85 },
                    { subject: "Math", score: 95 }
                  ]
                }
              ]
            }
          },
          { $unwind: { path: "$terms", preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              "terms.marks": {
                $reduce: {
                  input: { $ifNull: ["$terms.marks", []] },
                  initialValue: [],
                  in: {
                    $cond: [
                      { $in: ["$$this.subject", "$$value.subject"] },
                      "$$value", // ignores the later duplicate (keeps first)
                      { $concatArrays: ["$$value", ["$$this"]] }
                    ]
                  }
                }
              }
            }
          }
        ]);
        console.log(JSON.stringify(testDeduplication[0].terms, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
