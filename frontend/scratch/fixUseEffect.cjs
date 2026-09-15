const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/pages');

function updateFile(filename) {
  const filePath = path.join(srcDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Fix standard useEffect
  content = content.replace(
    /if \(availableStandards\.length > 0 && !availableStandards\.includes\(selectedClass\)\) {/,
    "if (availableStandards.length > 0 && selectedClass !== 'All' && !availableStandards.includes(selectedClass)) {"
  );
  
  // Fix section useEffect
  content = content.replace(
    /if \(availableSections\.length > 0 && !availableSections\.includes\(selectedSection\)\) {/,
    "if (availableSections.length > 0 && selectedSection !== 'All' && !availableSections.includes(selectedSection)) {"
  );
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filename}`);
  } else {
    console.log(`No changes made to ${filename}`);
  }
}

updateFile('Gradebook.jsx');
updateFile('Homework.jsx');
updateFile('Materials.jsx');

console.log('Script execution complete.');
