const fs = require('fs');
const path = 'backend/controllers/materialController.js';
let content = fs.readFileSync(path, 'utf8');

// In addMaterial
content = content.replace(
  /if \(!isAuthorizedForClass\(req\.dbUser, standard, section, true\)\)/g,
  "if (!isAuthorizedForClass(req.dbUser, standard, section, true, subject))"
);

// In deleteMaterial
content = content.replace(
  /if \(!isAuthorizedForClass\(req\.dbUser, material\.standard, material\.section, true\)\)/g,
  "if (!isAuthorizedForClass(req.dbUser, material.standard, material.section, true, material.subject))"
);

fs.writeFileSync(path, content, 'utf8');
console.log('done updating materialController');
