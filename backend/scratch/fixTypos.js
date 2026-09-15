const fs = require('fs');
const file = 'controllers/analyticsController.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('"$REMOVE"', '"$$REMOVE"');
content = content.replace('{ $eq: [ "$standard",  "$std" ] }', '{ $eq: [ "$standard",  "$$std" ] }');
content = content.replace('{ $eq: [ "$section", "$sec" ] }', '{ $eq: [ "$section", "$$sec" ] }');
fs.writeFileSync(file, content);
console.log("Fixed typos.");
