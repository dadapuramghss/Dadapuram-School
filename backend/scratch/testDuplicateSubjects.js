require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Student = require('../models/Student');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
    try {
        const students = await Student.find({ "terms.0": { $exists: true } });
        let duplicateCount = 0;
        
        for (const s of students) {
            for (const term of s.terms) {
                if (!term.marks) continue;
                
                const subjectCounts = {};
                for (const mark of term.marks) {
                    if (!subjectCounts[mark.subject]) {
                        subjectCounts[mark.subject] = [];
                    }
                    subjectCounts[mark.subject].push(mark.score);
                }
                
                for (const [subj, scores] of Object.entries(subjectCounts)) {
                    if (scores.length > 1) {
                        duplicateCount++;
                        console.log(`Duplicate found for student ${s.name} (${s.emisNumber}) in Term '${term.termName}': Subject '${subj}' with scores: ${scores.join(', ')}`);
                    }
                }
            }
        }
        console.log(`Total duplicate subject instances found: ${duplicateCount}`);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
