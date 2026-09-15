const fs = require('fs');
const path = 'backend/controllers/studentController.js';
let content = fs.readFileSync(path, 'utf8');

// 1. In updateStudentMarks
const updateStudentMarksAuth = `
    if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
      return res.status(403).json({ error: 'Not authorized to modify this student' });
    }

    // Verify subject authorization for each mark
    for (const m of marks) {
      if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true, m.subject)) {
        return res.status(403).json({ error: \`Not authorized to update marks for subject: \${m.subject}\` });
      }
    }
`;

content = content.replace(
  /if \(!isAuthorizedForClass\(req\.dbUser, student\.standard, student\.section, true\)\) \{\s*return res\.status\(403\)\.json\(\{ error: 'Not authorized to modify this student' \}\);\s*\}/,
  updateStudentMarksAuth.trim()
);

// 2. In bulkUpdateMarks
const bulkUpdateMarksAuth = `
      // Check authorization per student record
      if (!isAuthorizedForClass(req.dbUser, standard, section, true)) {
        results.errors.push(\`Not authorized to update EMIS: \${emisNumber}\`);
        continue;
      }
      
      let subjectAuthFailed = false;
      for (const m of marks) {
        if (!isAuthorizedForClass(req.dbUser, standard, section, true, m.subject)) {
          results.errors.push(\`Not authorized for subject \${m.subject} (EMIS: \${emisNumber})\`);
          subjectAuthFailed = true;
          break;
        }
      }
      if (subjectAuthFailed) continue;
`;

content = content.replace(
  /\/\/ Check authorization per student record\s*if \(!isAuthorizedForClass\(req\.dbUser, standard, section, true\)\) \{\s*results\.errors\.push\(`Not authorized to update EMIS: \$\{emisNumber\}`\);\s*continue;\s*\}/,
  bulkUpdateMarksAuth.trim()
);

// 3. In universalBulkUpdateMarks
const universalBulkUpdateMarksAuth = `
      // Check authorization per student record
      if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
        validationErrors.push(\`Row \${i + 2}: Not authorized to update EMIS \${emisNumber} (\${student.standard}-\${student.section}).\`);
      }

      // Validate Marks
      for (const m of marks) {
        if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true, m.subject)) {
           validationErrors.push(\`Row \${i + 2}: Not authorized for subject \${m.subject} (EMIS: \${emisNumber}).\`);
        }
        if (typeof m.score !== 'number' || isNaN(m.score) || m.score < 0 || m.score > 100) {
`;

content = content.replace(
  /\/\/ Check authorization per student record\s*if \(!isAuthorizedForClass\(req\.dbUser, student\.standard, student\.section, true\)\) \{\s*validationErrors\.push\(`Row \$\{i \+ 2\}: Not authorized to update EMIS \$\{emisNumber\} \(\$\{student\.standard\}-\$\{student\.section\}\)\.`\);\s*\}\s*\/\/ Validate Marks\s*for \(const m of marks\) \{\s*if \(typeof m\.score !== 'number' \|\| isNaN\(m\.score\) \|\| m\.score < 0 \|\| m\.score > 100\) \{/,
  universalBulkUpdateMarksAuth.trim()
);

fs.writeFileSync(path, content, 'utf8');
console.log('done updating studentController');
