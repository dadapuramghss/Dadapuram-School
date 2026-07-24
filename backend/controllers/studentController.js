const Student = require('../models/Student');

const isAuthorizedForClass = (user, standard, section, requireFullAccess = false) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && user.assignedClasses) {
    const classAssignment = user.assignedClasses.find(c => c.standard === standard && c.section === section);
    if (!classAssignment) return false;
    if (requireFullAccess && classAssignment.accessLevel === 'view') return false;
    return true;
  }
  return false;
};

// Add a new student
const addStudent = async (req, res) => {
  try {
    const { 
      emisNumber, name, standard, section, gender, medium, photoUrl, 
      tamilName, fatherName, dob, admissionNumber, religion, community, 
      address, mobileNumber 
    } = req.body;

    if (!isAuthorizedForClass(req.dbUser, standard, section, true)) {
      return res.status(403).json({ error: 'Not authorized for full access to this class and section' });
    }

    // Check if student with same emisNumber in this class exists
    const existingStudent = await Student.findOne({ emisNumber, standard, section });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student with this EMIS number already exists in this class section.' });
    }

    const newStudent = new Student({
      emisNumber,
      name,
      standard,
      section,
      gender,
      medium,
      photoUrl,
      tamilName, 
      fatherName, 
      dob, 
      admissionNumber, 
      religion, 
      community, 
      address,
      mobileNumber,
      terms: [] // initialized empty
    });

    await newStudent.save();
    res.status(201).json({ success: true, data: newStudent });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk Add/Update Students (Admin Only)
const bulkAddStudents = async (req, res) => {
  try {
    const students = req.body;
    if (!Array.isArray(students)) {
      return res.status(400).json({ error: 'Expected an array of students' });
    }

    if (req.dbUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can perform bulk operations' });
    }

    const results = {
      added: 0,
      updated: 0,
      errors: []
    };

    const bulkOps = [];
    let validCount = 0;

    for (const studentData of students) {
      const { emisNumber, name, standard, section, gender, medium } = studentData;
      
      if (!emisNumber || !name || !standard || !section || !medium) {
        results.errors.push(`Row missing required fields (EMIS: ${emisNumber || 'N/A'})`);
        continue;
      }
      
      validCount++;

      bulkOps.push({
        updateOne: {
          filter: { emisNumber, standard, section },
          update: { 
            $set: studentData,
            $setOnInsert: { terms: [] }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      try {
        const bulkResult = await Student.bulkWrite(bulkOps);
        results.added = bulkResult.upsertedCount || 0;
        // Approximation of updated count since unchanged upserts don't count as modified
        results.updated = validCount - results.added; 
      } catch (bulkError) {
        console.error('BulkWrite Error:', bulkError);
        // Extract write errors if it's a bulk write error (e.g. duplicate key on old index)
        if (bulkError.writeErrors) {
          bulkError.writeErrors.forEach(err => {
            results.errors.push(`DB Error: ${err.errmsg}`);
          });
          results.added = bulkError.result.nUpserted || 0;
          results.updated = bulkError.result.nModified || 0;
        } else {
          results.errors.push(`Server Error during import: ${bulkError.message}`);
        }
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error in bulk add students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get students for a specific class and section
const getStudentsByClass = async (req, res) => {
  try {
    const { standard, section } = req.query;
    if (!standard || !section) {
      return res.status(400).json({ error: 'Standard and section are required parameters' });
    }

    const query = {};
    if (standard !== 'All') query.standard = standard;
    if (section !== 'All') query.section = section;

    if (req.dbUser && req.dbUser.role !== 'admin') {
      if (!req.dbUser.assignedClasses || req.dbUser.assignedClasses.length === 0) {
        return res.json({ success: true, data: [] });
      }

      if (standard !== 'All' && section !== 'All') {
        if (!isAuthorizedForClass(req.dbUser, standard, section)) {
          return res.status(403).json({ error: 'Not authorized for this class and section' });
        }
      } else {
        let validClasses = req.dbUser.assignedClasses;
        if (standard !== 'All') validClasses = validClasses.filter(c => c.standard === standard);
        if (section !== 'All') validClasses = validClasses.filter(c => c.section === section);
        
        if (validClasses.length === 0) {
           return res.json({ success: true, data: [] });
        }
        
        query.$or = validClasses.map(c => ({ standard: c.standard, section: c.section }));
      }
    }

    const students = await Student.find(query).collation({ locale: 'en', strength: 2 }).sort({ name: 1 });
    res.status(200).json({ success: true, data: students });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update marks for a student
const updateStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { termName, marks } = req.body; 
    // marks should be an array: [{ subject: 'Math', score: 90 }, ...]

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
      return res.status(403).json({ error: 'Not authorized to modify this student' });
    }

    // Check if term already exists
    const termIndex = student.terms.findIndex(t => t.termName === termName);
    
    if (termIndex > -1) {
      // Update existing term
      student.terms[termIndex].marks = marks;
    } else {
      // Add new term
      student.terms.push({ termName, marks });
    }

    // Save with validateModifiedOnly to bypass validation errors for existing dirty data 
    // (e.g. students missing emisNumber)
    await student.save({ validateModifiedOnly: true });
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error('Error updating marks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Update student
const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const updateData = req.body;
    console.log("Updating student:", studentId, "Mobile Number:", updateData.mobileNumber);

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
      return res.status(403).json({ error: 'Not authorized to modify this student' });
    }

    if (updateData.standard && updateData.section && !isAuthorizedForClass(req.dbUser, updateData.standard, updateData.section, true)) {
      return res.status(403).json({ error: 'Not authorized to move student to this class and section' });
    }

    const updatedStudent = await Student.findByIdAndUpdate(studentId, updateData, { new: true });
    res.status(200).json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    // Optional: check if authorized for this class, but maybe allow any teacher to view profile if they can see top 3
    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
      return res.status(403).json({ error: 'Not authorized to delete this student' });
    }

    await Student.findByIdAndDelete(studentId);
    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk delete students
const bulkDeleteStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'No student IDs provided' });
    }

    // Find students first to verify authorization
    const students = await Student.find({ _id: { $in: studentIds } });
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'No students found' });
    }

    // Verify auth for all students
    for (const student of students) {
      if (!isAuthorizedForClass(req.dbUser, student.standard, student.section, true)) {
        return res.status(403).json({ error: 'Not authorized to delete some of these students' });
      }
    }

    await Student.deleteMany({ _id: { $in: studentIds } });
    res.status(200).json({ success: true, message: `${students.length} students deleted successfully` });
  } catch (error) {
    console.error('Error bulk deleting students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  addStudent,
  getStudentsByClass,
  getStudentById,
  updateStudentMarks,
  updateStudent,
  deleteStudent,
  bulkAddStudents,
  bulkDeleteStudents
};
