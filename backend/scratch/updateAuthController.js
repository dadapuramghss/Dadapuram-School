const fs = require('fs');
const path = 'backend/controllers/authController.js';
let content = fs.readFileSync(path, 'utf8');

// Add ClassConfig import
if (!content.includes("const ClassConfig = require('../models/ClassConfig');")) {
  content = content.replace(
    "const User = require('../models/User');",
    "const User = require('../models/User');\nconst ClassConfig = require('../models/ClassConfig');"
  );
}

// Validation logic helper
const validationHelper = `
    if (assignedClasses !== undefined) {
      const validatedClasses = [];
      const uniqueMap = new Map();
      
      for (const c of assignedClasses) {
        if (!c.standard || !c.section) {
          return res.status(400).json({ message: 'Standard and section are required for each assignment.' });
        }
        
        const config = await ClassConfig.findOne({ standard: c.standard, section: c.section });
        if (!config) {
          return res.status(400).json({ message: \`Invalid class assignment: \${c.standard}-\${c.section} does not exist.\` });
        }
        
        const subject = c.subject ? c.subject.trim() : null;
        if (subject) {
          if (!config.subjects || !config.subjects.includes(subject)) {
            return res.status(400).json({ message: \`Invalid subject \${subject} for \${c.standard}-\${c.section}.\` });
          }
        }
        
        const key = \`\${c.standard}-\${c.section}-\${subject || 'ALL'}\`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { ...c, subject });
          validatedClasses.push({ ...c, subject });
        }
      }
      
      updateData.assignedClasses = validatedClasses;
    }
`;

// Replace in approveUser
content = content.replace(
  /if \(assignedClasses !== undefined\) \{\s*updateData\.assignedClasses = assignedClasses;\s*\}/m,
  validationHelper.trim()
);

fs.writeFileSync(path, content, 'utf8');
console.log('done');
