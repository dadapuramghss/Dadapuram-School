const fs = require('fs');
const path = 'frontend/src/pages/AdminUsers.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add editingAssignmentIndex state
content = content.replace(
  "const [newClass, setNewClass] = useState({ standard: '6', section: 'A', subject: '', accessLevel: 'full' });",
  "const [newClass, setNewClass] = useState({ standard: '6', section: 'A', subject: '', accessLevel: 'full' });\n  const [editingAssignmentIndex, setEditingAssignmentIndex] = useState(null);"
);

// 2. Update closeModal
content = content.replace(
  "setAssignedClasses([]);\n  };",
  "setAssignedClasses([]);\n    setEditingAssignmentIndex(null);\n  };"
);

// 3. Replace addClass with saveAssignment and add startEditAssignment
const newSaveLogic = `
  const saveAssignment = () => {
    // Check for exact duplicate in other indices
    const duplicateIndex = assignedClasses.findIndex(
      (c, idx) => idx !== editingAssignmentIndex && c.standard === newClass.standard && c.section === newClass.section && (c.subject || '') === (newClass.subject || '')
    );
    
    if (duplicateIndex >= 0) {
      alert("This assignment already exists.");
      return;
    }

    if (editingAssignmentIndex !== null) {
      // Update existing assignment at editing index
      const updatedClasses = [...assignedClasses];
      updatedClasses[editingAssignmentIndex] = { ...newClass };
      setAssignedClasses(updatedClasses);
      setEditingAssignmentIndex(null);
    } else {
      // Add new class
      setAssignedClasses([...assignedClasses, { ...newClass }]);
    }

    // Reset form to default Add mode but keep class/section selected for speed
    setNewClass({ standard: newClass.standard, section: newClass.section, subject: '', accessLevel: 'full' });
  };

  const startEditAssignment = (index) => {
    setEditingAssignmentIndex(index);
    setNewClass({ ...assignedClasses[index] });
  };

  const cancelEdit = () => {
    setEditingAssignmentIndex(null);
    setNewClass({ standard: newClass.standard, section: newClass.section, subject: '', accessLevel: 'full' });
  };
`;
content = content.replace(
  /const addClass = \(\) => \{[\s\S]*?\}\s*};\s*const removeClass/,
  newSaveLogic.trim() + "\n\n  const removeClass"
);

// 4. Update the "Add" button to call saveAssignment and show Update
content = content.replace(
  /<NeonButton onClick=\{addClass\} variant="secondary" className="py-2 px-4 whitespace-nowrap">\s*Add\s*<\/NeonButton>/,
  `<NeonButton onClick={saveAssignment} variant="secondary" className="py-2 px-4 whitespace-nowrap">
                  {editingAssignmentIndex !== null ? 'Update' : 'Add'}
                </NeonButton>
                {editingAssignmentIndex !== null && (
                  <button onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-900 ml-2">
                    Cancel
                  </button>
                )}`
);

// 5. Update chips to add Edit button
content = content.replace(
  /\{cls\.standard\}-\{cls\.section\} • \{cls\.subject \|\| 'All Subjects'\} \(\{cls\.accessLevel === 'view' \? 'View' : 'Full'\}\)/,
  `{cls.standard}-{cls.section} • {cls.subject || 'All Subjects'} ({cls.accessLevel === 'view' ? 'View' : 'Full'})
                        <button onClick={() => startEditAssignment(idx)} className="hover:text-blue-600 transition-colors ml-1" title="Edit">
                          ✎
                        </button>`
);

fs.writeFileSync(path, content, 'utf8');
console.log('done updating AdminUsers.jsx');
