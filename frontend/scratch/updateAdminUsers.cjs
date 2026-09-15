const fs = require('fs');
const path = 'frontend/src/pages/AdminUsers.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update newClass state
content = content.replace(
  "const [newClass, setNewClass] = useState({ standard: '6', section: 'A', accessLevel: 'full' });",
  "const [newClass, setNewClass] = useState({ standard: '6', section: 'A', subject: '', accessLevel: 'full' });"
);

// 2. Update addClass logic
content = content.replace(
  /const addClass = \(\) => \{\s*const existingIndex = assignedClasses\.findIndex\(\s*c => c\.standard === newClass\.standard && c\.section === newClass\.section\s*\);/,
  `const addClass = () => {
    const existingIndex = assignedClasses.findIndex(
      c => c.standard === newClass.standard && c.section === newClass.section && (c.subject || '') === (newClass.subject || '')
    );`
);

// 3. Update standard onChange
const standardOnChange = `
                    onChange={(e) => {
                      const newStandard = e.target.value;
                      const validSections = classConfigs.filter(c => c.standard === newStandard).map(c => c.section).sort();
                      const firstSection = validSections[0] || '';
                      setNewClass({
                        ...newClass, 
                        standard: newStandard,
                        section: validSections.includes(newClass.section) ? newClass.section : firstSection,
                        subject: ''
                      });
                    }}
`;
content = content.replace(
  /onChange=\{\(e\) => \{\s*const newStandard = e\.target\.value;\s*const validSections = classConfigs\.filter\(c => c\.standard === newStandard\)\.map\(c => c\.section\)\.sort\(\);\s*setNewClass\(\{\s*\.\.\.newClass, \s*standard: newStandard,\s*section: validSections\.includes\(newClass\.section\) \? newClass\.section : \(validSections\[0\] || ''\)\s*\}\);\s*\}\}/,
  standardOnChange.trim()
);

// 4. Add Subject dropdown before Access Level
const subjectDropdownHtml = `
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-gray-600">Subject</label>
                  <select 
                    value={newClass.subject || ''}
                    onChange={(e) => setNewClass({...newClass, subject: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 [&>option]:bg-white"
                    disabled={!newClass.standard || !newClass.section}
                  >
                    <option value="">All Subjects</option>
                    {(classConfigs.find(c => c.standard === newClass.standard && c.section === newClass.section)?.subjects || []).sort().map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
`;
content = content.replace(
  /<div className="flex-1 space-y-1">\s*<label className="text-sm text-gray-600">Access Level<\/label>/,
  subjectDropdownHtml.trim() + '\n                <div className="flex-1 space-y-1">\n                  <label className="text-sm text-gray-600">Access Level</label>'
);

// 5. Update chips
const newChipContent = `{cls.standard}-{cls.section} • {cls.subject || 'All Subjects'} ({cls.accessLevel === 'view' ? 'View' : 'Full'})`;
content = content.replace(
  /\{cls\.standard\} - \{cls\.section\} \(\{cls\.accessLevel === 'view' \? 'View' : 'Full'\}\)/,
  newChipContent
);

fs.writeFileSync(path, content, 'utf8');
console.log('done updating AdminUsers.jsx');
