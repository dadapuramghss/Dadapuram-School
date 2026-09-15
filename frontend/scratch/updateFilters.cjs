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

// 1. Leaderboard.jsx
updateFile('Leaderboard.jsx', [
  {
    find: /<option value="All">All Standards \(Whole School\)<\/option>[\s\S]*?<option value="12">Standard 12<\/option>/,
    replace: `<option value="All">All Standards (Whole School)</option>\n            {[...new Set(classConfigs.map(c => c.standard))].sort((a,b) => Number(a) - Number(b)).map(std => (\n              <option key={std} value={std}>Standard {std}</option>\n            ))}`
  }
]);

// 2. Gradebook.jsx
updateFile('Gradebook.jsx', [
  {
    find: /<option value="All">All Standards<\/option>/g,
    replace: '<option value="All">All Standards (Whole School)</option>'
  },
  {
    find: /onChange=\{e => \{\s*setSelectedClass\(e\.target\.value\);\s*if \(e\.target\.value === 'All'\) setSelectedSection\('All'\);\s*\}\}/,
    replace: `onChange={e => {\n                setSelectedClass(e.target.value);\n                setSelectedSection('All');\n              }}`
  }
]);

// 3. Homework.jsx
updateFile('Homework.jsx', [
  {
    find: /<option value="All">All Standards<\/option>/g,
    replace: '<option value="All">All Standards (Whole School)</option>'
  },
  {
    find: /onChange=\{\(e\) => setSelectedClass\(e\.target\.value\)\}/,
    replace: `onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection('All'); }}`
  }
]);

// 4. Materials.jsx
updateFile('Materials.jsx', [
  {
    find: /<option value="All">All Standards<\/option>/g,
    replace: '<option value="All">All Standards (Whole School)</option>'
  },
  {
    find: /onChange=\{\(e\) => setSelectedClass\(e\.target\.value\)\}/,
    replace: `onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection('All'); }}`
  }
]);

// 5. AdminReports.jsx
updateFile('AdminReports.jsx', [
  {
    find: /<select value=\{attFilters\.standard\}.*?>\s*\{standards\.map\(std => <option key=\{std\} value=\{std\}>\{std\}<\/option>\)\}\s*<\/select>/,
    replace: `<select value={attFilters.standard} onChange={e => setAttFilters({...attFilters, standard: e.target.value, section: 'All'})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none">\n                <option value="All">All Standards (Whole School)</option>\n                {standards.map(std => <option key={std} value={std}>{std}</option>)}\n              </select>`
  },
  {
    find: /<select value=\{attFilters\.section\}.*?>\s*\{sections\.map\(sec => <option key=\{sec\} value=\{sec\}>\{sec\}<\/option>\)\}\s*<\/select>/,
    replace: `<select value={attFilters.section} onChange={e => setAttFilters({...attFilters, section: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#FCA311] outline-none">\n                <option value="All">All Sections</option>\n                {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}\n              </select>`
  }
]);

// 6. DataSync.jsx
updateFile('DataSync.jsx', [
  {
    find: /<option value="All">All Standards<\/option>/g,
    replace: '<option value="All">All Standards (Whole School)</option>'
  },
  {
    find: /onChange=\{\(e\) => setSelectedStandard\(e\.target\.value\)\}/,
    replace: `onChange={(e) => { setSelectedStandard(e.target.value); setSelectedSection(''); }}`
  }
]);

console.log('Script execution complete.');
