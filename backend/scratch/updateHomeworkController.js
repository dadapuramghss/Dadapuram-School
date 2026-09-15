const fs = require('fs');
const path = 'backend/controllers/homeworkController.js';
let content = fs.readFileSync(path, 'utf8');

// In addHomework
content = content.replace(
  /if \(!isAuthorizedForClass\(req\.dbUser, standard, sec, true\)\)/g,
  "if (!isAuthorizedForClass(req.dbUser, standard, sec, true, subject))"
);

// In updateHomework
content = content.replace(
  /if \(!isAuthorizedForClass\(req\.dbUser, targetStandard, sec, true\)\)/g,
  "if (!isAuthorizedForClass(req.dbUser, targetStandard, sec, true, req.body.subject || homework.subject))"
);

// In deleteHomework
content = content.replace(
  /if \(!isAuthorizedForClass\(req\.dbUser, homework\.standard, sec, true\)\)/g,
  "if (!isAuthorizedForClass(req.dbUser, homework.standard, sec, true, homework.subject))"
);

fs.writeFileSync(path, content, 'utf8');
console.log('done updating homeworkController');
