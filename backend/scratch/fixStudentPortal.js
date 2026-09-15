const fs = require('fs');

let code = fs.readFileSync('routes/studentPortalRoutes.js', 'utf8');

const oldCode = `// GET /api/student-portal/me
router.get('/me', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student.toObject();

    // Calculate class rank for each term
    const peers = await Student.find({ standard: student.standard, section: student.section }).lean();
    
    student.terms = student.terms.map(term => {
      const myScore = term.marks.reduce((sum, m) => sum + m.score, 0);
      let betterStudents = 0;
      let totalAssessed = 0;
      
      peers.forEach(peer => {
        const peerTerm = peer.terms?.find(t => t.termName === term.termName);
        if (peerTerm && peerTerm.marks && peerTerm.marks.length > 0) {
          totalAssessed++;
          const peerScore = peerTerm.marks.reduce((sum, m) => sum + m.score, 0);
          if (peerScore > myScore) {
            betterStudents++;
          }
        }
      });
      
      return {
        ...term,
        rank: betterStudents + 1,
        totalAssessed
      };
    });

    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});`;

const newCode = `// GET /api/student-portal/me
router.get('/me', verifyStudentToken, async (req, res) => {
  try {
    const student = req.student.toObject();

    const ClassConfig = require('../models/ClassConfig');
    const config = await ClassConfig.findOne({ standard: student.standard, section: student.section });
    let expectedSubjectsCount = config && config.subjects ? config.subjects.length : 0;
    if (expectedSubjectsCount === 0) {
      expectedSubjectsCount = ['11', '12'].includes(student.standard) ? 6 : 5;
    }
    const maximumMarks = expectedSubjectsCount * 100;

    const deduplicateMarks = (term) => {
      if (!term || !term.marks) return 0;
      let score = 0;
      const seen = new Set();
      term.marks.forEach(m => {
        if (!seen.has(m.subject)) {
          seen.add(m.subject);
          score += (Number(m.score) || 0);
        }
      });
      return score;
    };

    const peers = await Student.find({ standard: student.standard, section: student.section }).lean();
    
    student.terms = student.terms.map(term => {
      const myScore = deduplicateMarks(term);
      const myPercentage = maximumMarks > 0 ? Number(((myScore / maximumMarks) * 100).toFixed(2)) : 0;
      
      let betterStudents = 0;
      let totalAssessed = 0;
      
      peers.forEach(peer => {
        const peerTerm = peer.terms?.find(t => t.termName === term.termName);
        if (peerTerm && peerTerm.marks && peerTerm.marks.length > 0) {
          totalAssessed++;
          const peerScore = deduplicateMarks(peerTerm);
          const peerPercentage = maximumMarks > 0 ? Number(((peerScore / maximumMarks) * 100).toFixed(2)) : 0;
          
          if (peerPercentage > myPercentage) {
            betterStudents++;
          } else if (peerPercentage === myPercentage) {
            if (peerScore > myScore) {
               betterStudents++;
            } else if (peerScore === myScore) {
               if ((peer.name || '').localeCompare(student.name || '') < 0) {
                  betterStudents++;
               }
            }
          }
        }
      });
      
      // Inject deduplicated marks into the response so frontend doesn't need to deduplicate again
      const uniqueMarks = [];
      const seen = new Set();
      (term.marks || []).forEach(m => {
        if (!seen.has(m.subject)) {
          seen.add(m.subject);
          uniqueMarks.push(m);
        }
      });
      term.marks = uniqueMarks;

      return {
        ...term,
        rank: betterStudents + 1,
        totalAssessed,
        totalScore: myScore,
        maximumMarks,
        percentage: myPercentage
      };
    });

    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('routes/studentPortalRoutes.js', code);
  console.log("Successfully replaced /me route in studentPortalRoutes.js");
} else {
  console.log("Error: Could not find old /me route code.");
}
