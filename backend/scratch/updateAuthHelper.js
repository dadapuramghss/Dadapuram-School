const fs = require('fs');

const authFunction = `
const isAuthorizedForClass = (user, standard, section, requireFullAccess = false, subject = null) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  if (user.role === 'teacher' && user.assignedClasses) {
    const assignments = user.assignedClasses.filter(c => c.standard === standard && c.section === section);
    if (assignments.length === 0) return false;
    
    for (const assignment of assignments) {
      if (requireFullAccess && assignment.accessLevel === 'view') continue;
      
      if (subject) {
        if (!assignment.subject || assignment.subject === subject) {
          return true;
        }
      } else {
        return true;
      }
    }
  }
  return false;
};
`;

const files = [
  'backend/controllers/homeworkController.js',
  'backend/controllers/materialController.js',
  'backend/controllers/studentController.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the old function
  // It usually looks like:
  // const isAuthorizedForClass = (user, standard, section, requireFullAccess = false) => {
  //   ...
  // };
  
  const regex = /const isAuthorizedForClass = \([\s\S]*?^};/m;
  content = content.replace(regex, authFunction.trim());
  
  fs.writeFileSync(file, content, 'utf8');
}
console.log('done updating isAuthorizedForClass');
