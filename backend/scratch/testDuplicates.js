require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Student = require('../models/Student');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
    try {
        const students = await Student.find({ "terms.0": { $exists: true } });
        for (const s of students) {
            const termCounts = {};
            for (const t of s.terms) {
                termCounts[t.termName] = (termCounts[t.termName] || 0) + 1;
                if (termCounts[t.termName] > 1) {
                    console.log(`Duplicate term found for ${s.name} (${s.emisNumber}): ${t.termName}`);
                }
            }
        }
        console.log("Done checking duplicates.");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
