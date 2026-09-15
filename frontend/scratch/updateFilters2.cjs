const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/pages');

function updateFile(filename, replacements) {
  const filePath = path.join(srcDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const r of replacements) {
    if (typeof r.find === 'string') {
      content = content.replace(r.find, r.replace);
    } else {
      content = content.replace(r.find, r.replace);
    }
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filename}`);
  } else {
    console.log(`No changes made to ${filename}`);
  }
}

// 3. Homework.jsx
updateFile('Homework.jsx', [
  {
    find: /<option value="All">Select Class<\/option>/g,
    replace: '<option value="All">All Standards (Whole School)</option>'
  },
  {
    find: /<option value="All">Select Section<\/option>/g,
    replace: '<option value="All">All Sections</option>'
  },
  {
    find: /onChange=\{e => \{\s*setSelectedClass\(e\.target\.value\);\s*if \(e\.target\.value === 'All'\) setSelectedSection\('All'\);\s*\}\}/,
    replace: `onChange={e => {\n                setSelectedClass(e.target.value);\n                setSelectedSection('All');\n              }}`
  }
]);

// 4. Materials.jsx
updateFile('Materials.jsx', [
  {
    find: /<option value="All">Select Class<\/option>/g,
    replace: '<option value="All">All Standards (Whole School)</option>'
  },
  {
    find: /<option value="All">Select Section<\/option>/g,
    replace: '<option value="All">All Sections</option>'
  },
  {
    find: /onChange=\{e => \{\s*setSelectedClass\(e\.target\.value\);\s*if \(e\.target\.value === 'All'\) setSelectedSection\('All'\);\s*\}\}/,
    replace: `onChange={e => {\n                setSelectedClass(e.target.value);\n                setSelectedSection('All');\n              }}`
  }
]);

console.log('Script execution complete.');
