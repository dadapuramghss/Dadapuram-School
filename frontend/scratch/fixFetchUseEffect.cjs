const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/pages');

function updateFile(filename, functionName, listSetter) {
  const filePath = path.join(srcDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Replace the useEffect block
  const searchPattern = new RegExp(`  useEffect\\(\\&\\#x3D;\\&\\#x3E; \\{\\n    if \\(isClassSelected\\) \\{\\n      ${functionName}\\(\\);\\n    \\} else \\{\\n      ${listSetter}\\(\\[\\]\\);\\n    \\}`, 'g');
  
  content = content.replace(
    `  useEffect(() => {\n    if (isClassSelected) {\n      ${functionName}();\n    } else {\n      ${listSetter}([]);\n    }`,
    `  useEffect(() => {\n    ${functionName}();`
  );
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filename}`);
  } else {
    console.log(`No changes made to ${filename}`);
  }
}

updateFile('Homework.jsx', 'loadHomework', 'setHomeworkList');
updateFile('Materials.jsx', 'loadMaterials', 'setMaterialsList');

console.log('Script execution complete.');
