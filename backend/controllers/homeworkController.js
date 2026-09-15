const Homework = require('../models/Homework');
const ClassConfig = require('../models/ClassConfig');

// Check authorization (using similar logic to studentController)
const isAuthorizedForClass = (user, standard, section, requireFullAccess = false, subject = null) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  if (user.role === 'teacher' && user.assignedClasses) {
    const assignments = user.assignedClasses.filter(c => c.standard === standard && c.section === section);
    if (assignments.length === 0) return false;
    
    for (const assignment of assignments) {
      if (requireFullAccess && assignment.accessLevel === 'view') continue;
      
      if (subject) {
        if (!assignment.subject || assignment.subject === subject) {
          return true;
        }
      } else {
        return true;
      }
    }
  }
  return false;
};

// Add homework
const addHomework = async (req, res) => {
  try {
    const { title, description, subject, standard, section, sections, dueDate, photoUrl, photoUrls, voiceUrl, link } = req.body;

    let targetSections = [];
    if (sections && Array.isArray(sections)) {
      targetSections = [...new Set(sections.map(s => String(s).trim()).filter(Boolean))];
    } else if (section) {
      targetSections = [String(section).trim()];
    }

    if (targetSections.length === 0) {
      return res.status(400).json({ error: 'At least one section is required' });
    }

    // Validate sections against ClassConfig
    const validConfigs = await ClassConfig.find({ standard, section: { $in: targetSections } });
    const validSectionNames = validConfigs.map(c => c.section);
    
    for (const sec of targetSections) {
      if (!validSectionNames.includes(sec)) {
        return res.status(400).json({ error: `Section ${sec} does not exist for Standard ${standard}` });
      }
      if (!isAuthorizedForClass(req.dbUser, standard, sec, true, subject)) {
        return res.status(403).json({ error: `Not authorized for full access to class ${standard} section ${sec}` });
      }
    }

    const newHomework = new Homework({
      title,
      description,
      subject,
      standard,
      sections: targetSections, // New array format
      dueDate,
      photoUrl,
      photoUrls,
      voiceUrl,
      link,
      assignedBy: req.dbUser.name
    });

    await newHomework.save();
    res.status(201).json({ success: true, data: newHomework });
  } catch (error) {
    console.error('Error adding homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update homework
const updateHomework = async (req, res) => {
  try {
    const { homeworkId } = req.params;
    const { title, description, subject, standard, section, sections, dueDate, photoUrl, photoUrls, voiceUrl, link } = req.body;

    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Verify existing authorization first
    const existingSections = homework.sections && homework.sections.length > 0 
      ? homework.sections 
      : [homework.section];
      
    for (const sec of existingSections) {
      if (sec && !isAuthorizedForClass(req.dbUser, homework.standard, sec, true)) {
        return res.status(403).json({ error: 'Not authorized to modify this homework' });
      }
    }

    let targetSections = [];
    if (sections && Array.isArray(sections)) {
      targetSections = [...new Set(sections.map(s => String(s).trim()).filter(Boolean))];
    } else if (section) {
      targetSections = [String(section).trim()];
    }

    if (targetSections.length === 0) {
      return res.status(400).json({ error: 'At least one section is required' });
    }

    const validConfigs = await ClassConfig.find({ standard, section: { $in: targetSections } });
    const validSectionNames = validConfigs.map(c => c.section);

    for (const sec of targetSections) {
      if (!validSectionNames.includes(sec)) {
        return res.status(400).json({ error: `Section ${sec} does not exist for Standard ${standard}` });
      }
      if (!isAuthorizedForClass(req.dbUser, standard, sec, true, subject)) {
        return res.status(403).json({ error: `Not authorized for full access to class ${standard} section ${sec}` });
      }
    }

    homework.title = title;
    homework.description = description;
    homework.subject = subject;
    homework.standard = standard;
    homework.sections = targetSections;
    homework.section = undefined; // Clear legacy section to prefer sections array
    homework.dueDate = dueDate;
    
    if (photoUrl !== undefined) homework.photoUrl = photoUrl;
    if (photoUrls !== undefined) homework.photoUrls = photoUrls;
    if (voiceUrl !== undefined) homework.voiceUrl = voiceUrl;
    if (link !== undefined) homework.link = link;

    await homework.save();
    res.status(200).json({ success: true, data: homework });
  } catch (error) {
    console.error('Error updating homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get homework by class
const getHomeworkByClass = async (req, res) => {
  try {
    const { standard, section } = req.query;
    if (!standard || !section) {
      return res.status(400).json({ error: 'Standard and section are required parameters' });
    }

    const query = {};

    if (req.dbUser && req.dbUser.role !== 'admin') {
      if (!req.dbUser.assignedClasses || req.dbUser.assignedClasses.length === 0) {
        return res.json({ success: true, data: [] });
      }

      if (standard !== 'All' && section !== 'All') {
        if (!isAuthorizedForClass(req.dbUser, standard, section)) {
          return res.status(403).json({ error: 'Not authorized for this class and section' });
        }
        query.standard = standard;
        query.$or = [{ section: section }, { sections: section }];
      } else {
        let validClasses = req.dbUser.assignedClasses;
        if (standard !== 'All') validClasses = validClasses.filter(c => c.standard === standard);
        if (section !== 'All') validClasses = validClasses.filter(c => c.section === section);
        
        if (validClasses.length === 0) {
           return res.json({ success: true, data: [] });
        }
        
        query.$or = validClasses.map(c => ({ 
          standard: c.standard, 
          $or: [{ section: c.section }, { sections: c.section }] 
        }));
      }
    } else {
      if (standard !== 'All') query.standard = standard;
      if (section !== 'All') query.$or = [{ section: section }, { sections: section }];
    }

    const homeworkList = await Homework.find(query).sort({ dueDate: 1 });
    res.status(200).json({ success: true, data: homeworkList });
  } catch (error) {
    console.error('Error fetching homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete homework
const deleteHomework = async (req, res) => {
  try {
    const { homeworkId } = req.params;

    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    const targetSections = homework.sections && homework.sections.length > 0 ? homework.sections : [homework.section];

    for (const sec of targetSections) {
      if (sec && !isAuthorizedForClass(req.dbUser, homework.standard, sec, true)) {
        return res.status(403).json({ error: 'Not authorized to delete this homework' });
      }
    }

    await Homework.findByIdAndDelete(homeworkId);
    res.status(200).json({ success: true, message: 'Homework deleted successfully' });
  } catch (error) {
    console.error('Error deleting homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  addHomework,
  updateHomework,
  getHomeworkByClass,
  deleteHomework
};
