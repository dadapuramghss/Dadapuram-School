const fs = require('fs');

const path = 'frontend/src/pages/Homework.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add editingHomeworkId
content = content.replace(
  "const [isAdding, setIsAdding] = useState(false);",
  "const [isAdding, setIsAdding] = useState(false);\n  const [editingHomeworkId, setEditingHomeworkId] = useState(null);"
);

// Add sections to newHomework
content = content.replace(
  "link: ''\n  });",
  "link: '',\n    sections: []\n  });"
);

// Update resetForm
content = content.replace(
  "link: ''\n    });",
  "link: '',\n      sections: []\n    });\n    setEditingHomeworkId(null);"
);

// Update handleAddSubmit
const submitLogic = `
      const payload = {
        ...newHomework,
        standard: selectedClass,
        photoUrl: photoUrls.length > 0 ? photoUrls[0] : null,
        photoUrls,
        voiceUrl
      };
      
      // Ensure at least one section is selected if form supports sections
      if (newHomework.sections && newHomework.sections.length > 0) {
        payload.sections = newHomework.sections;
      } else {
        payload.sections = [selectedSection];
      }

      if (editingHomeworkId) {
        await api.updateHomework(editingHomeworkId, payload);
      } else {
        await api.addHomework(payload);
      }
      
      setIsAdding(false);
`;

content = content.replace(
  /await api\.addHomework\(\{[\s\S]*?\}\);/m,
  submitLogic.trim()
);

// Add handleEdit function before handleDelete
const handleEdit = `
  const handleEdit = (hw) => {
    setEditingHomeworkId(hw._id);
    setNewHomework({
      title: hw.title || '',
      description: hw.description || '',
      subject: hw.subject || currentSubjects[0] || '',
      dueDate: hw.dueDate ? new Date(hw.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      link: hw.link || '',
      sections: hw.sections?.length > 0 ? hw.sections : (hw.section ? [hw.section] : [selectedSection])
    });
    
    setPreviewUrls(hw.photoUrls?.length > 0 ? hw.photoUrls : (hw.photoUrl ? [hw.photoUrl] : []));
    setFiles([]); // We don't load files back, they are already on server, user can add new ones or clear.
    setAudioUrl(hw.voiceUrl || null);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete
`;

content = content.replace("const handleDelete", handleEdit.trim());

// Update header text
content = content.replace(
  "Assign New Homework",
  "{editingHomeworkId ? 'Edit Homework' : 'Assign New Homework'}"
);

// Add Edit Button in card
const editButtonHtml = `
                {hasFullAccess && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(hw)}
                      className="text-blue-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 bg-white/80 dark:bg-gray-900/50 p-1 rounded-md"
                      title="Edit Homework"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(hw._id)}
                      className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 bg-white/80 dark:bg-gray-900/50 p-1 rounded-md"
                      title="Delete Homework"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
`;

content = content.replace(
  /\{hasFullAccess && \([\s\S]*?<\/button>\s*\)\}/m,
  editButtonHtml.trim()
);

// Update homework list display sections
const sectionDisplay = `
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 items-center">
                  <span className="bg-adminSidebar/20 text-[#2E1C40] dark:text-adminSidebar px-3 py-1 rounded-full text-xs font-bold">
                    {hw.subject}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {hw.sections && hw.sections.length > 0 
                      ? (hw.sections.length > 1 ? 'Sections: ' : 'Section: ') + hw.sections.join(', ')
                      : (hw.section ? 'Section: ' + hw.section : '')}
                  </span>
                </div>
`;

content = content.replace(
  /<div className="flex justify-between items-start mb-2">\s*<span className="bg-adminSidebar\/20 text-\[#2E1C40\] dark:text-adminSidebar px-3 py-1 rounded-full text-xs font-bold">\s*\{hw\.subject\}\s*<\/span>/m,
  sectionDisplay.trim()
);

// Update form UI to include section checkboxes
const formSectionsHtml = `
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-2">Assign to Sections</label>
                <div className="flex flex-wrap gap-3">
                  {availableSections.map(sec => (
                    <label key={sec} className="flex items-center gap-2 cursor-pointer bg-white dark:bg-[#1A1A24] px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-adminSidebar/50 transition-colors">
                      <input 
                        type="checkbox"
                        checked={newHomework.sections?.includes(sec)}
                        onChange={(e) => {
                          const currentSections = newHomework.sections || [];
                          if (e.target.checked) {
                            setNewHomework({...newHomework, sections: [...currentSections, sec]});
                          } else {
                            setNewHomework({...newHomework, sections: currentSections.filter(s => s !== sec)});
                          }
                        }}
                        className="rounded text-adminSidebar focus:ring-adminSidebar"
                      />
                      <span className="text-[#2E1C40] dark:text-gray-200 font-medium text-sm">Section {sec}</span>
                    </label>
                  ))}
                </div>
                {(!newHomework.sections || newHomework.sections.length === 0) && (
                  <p className="text-red-500 text-xs mt-1">Please select at least one section.</p>
                )}
              </div>
`;

// Insert the sections UI before the Title input
content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\s*<div>\s*<label className="block text-sm font-bold text-\[#4C677C\] dark:text-\[#E5D9C4\] mb-1">Title<\/label>/m,
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n' + formSectionsHtml + '              <div>\n                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Title</label>'
);

// Ensure the Save button text changes
content = content.replace(
  "{loading ? 'Assigning...' : 'Assign Homework'}",
  "{loading ? (editingHomeworkId ? 'Updating...' : 'Assigning...') : (editingHomeworkId ? 'Update Homework' : 'Assign Homework')}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('done');
