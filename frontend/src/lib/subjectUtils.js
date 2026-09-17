export function getAssignedSubjectsForClassSection(user, classConfigs, standard, sections, requireIntersection = true) {
  if (!classConfigs) return [];

  // If a single string is passed, convert to array for consistent handling
  const sectionList = Array.isArray(sections) ? sections : [sections];

  let targets = [];
  if (standard === 'All') {
    targets = classConfigs.map(c => ({ std: c.standard, sec: c.section }));
  } else if (sectionList.length === 1 && sectionList[0] === 'All') {
    targets = classConfigs.filter(c => c.standard === standard).map(c => ({ std: c.standard, sec: c.section }));
  } else {
    targets = sectionList.map(sec => ({ std: standard, sec }));
  }

  // Admin has full access to valid subjects for all targets
  if (user?.role === 'admin') {
    const valid = new Set();
    targets.forEach(t => {
      const config = classConfigs.find(c => c.standard === t.std && c.section === t.sec);
      if (config && config.subjects) {
        config.subjects.forEach(s => valid.add(s));
      }
    });
    return [...new Set(classConfigs.flatMap(c => c.subjects))].filter(s => valid.has(s));
  }

  if (!user?.assignedClasses) {
    return [];
  }

  // For each target, find the authorized subjects for that specific standard/section
  const targetSubjectsList = targets.map(target => {
    const validSubjects = classConfigs.find(c => c.standard === target.std && c.section === target.sec)?.subjects || [];
    const assignments = user.assignedClasses.filter(c => c.standard === target.std && c.section === target.sec);
    
    if (assignments.length === 0) return new Set(); // No access

    const hasAllSubjectsAccess = assignments.some(c => !c.subject || c.subject.trim() === '');
    if (hasAllSubjectsAccess) return new Set(validSubjects);

    const authorized = new Set();
    assignments.forEach(c => {
      if (c.subject) authorized.add(c.subject.trim());
    });
    
    // Only valid subjects
    return new Set(validSubjects.filter(s => authorized.has(s)));
  });

  if (targetSubjectsList.length === 0) return [];

  let finalSubjects = new Set();
  
  if (requireIntersection && sectionList.length > 1 && sectionList[0] !== 'All') {
    // Intersect all sets (only for explicit multiple selections)
    finalSubjects = new Set(targetSubjectsList[0]);
    for (let i = 1; i < targetSubjectsList.length; i++) {
      for (const subj of finalSubjects) {
        if (!targetSubjectsList[i].has(subj)) {
          finalSubjects.delete(subj);
        }
      }
    }
  } else {
    // Union for 'All' selections or single selection
    targetSubjectsList.forEach(set => {
      set.forEach(subj => finalSubjects.add(subj));
    });
  }

  // Preserve ClassConfig order
  return [...new Set(classConfigs.flatMap(c => c.subjects))].filter(s => finalSubjects.has(s));
}
