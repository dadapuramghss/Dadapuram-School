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
  
  // Gradebook.jsx
  if (filename === 'Gradebook.jsx') {
    content = content.replace(/if \(!isClassSelected\) return;/g, '// if (!isClassSelected) return;');
    content = content.replace(/\{!isClassSelected \? \([\s\S]*?\) : loading \? \(/g, '{loading ? (');
  }
  
  // Homework.jsx
  if (filename === 'Homework.jsx') {
    content = content.replace(/if \(!isClassSelected\) return;/g, '// if (!isClassSelected) return;');
    content = content.replace(/\{!isClassSelected \? \([\s\S]*?\) : loading \? \(/g, '{loading ? (');
  }
  
  // Materials.jsx
  if (filename === 'Materials.jsx') {
    content = content.replace(/if \(!isClassSelected\) return;/g, '// if (!isClassSelected) return;');
    content = content.replace(/\{!isClassSelected \? \([\s\S]*?\) : loading \? \(/g, '{loading ? (');
  }
  
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
