require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Student = require('../models/Student');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
    try {
        const studentWithDuplicates = await Student.aggregate([
          { $unwind: { path: "$terms", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$terms.marks", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$_id",
              name: { $first: "$name" },
              standard: { $first: "$standard" },
              totalMarks: { $sum: "$terms.marks.score" },
              subjectsCount: { $sum: { $cond: [ { $gt: ["$terms.marks.score", -1] }, 1, 0 ] } }
            }
          },
          { $sort: { totalMarks: -1 } },
          { $limit: 10 }
        ]);
        console.log(JSON.stringify(studentWithDuplicates, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
