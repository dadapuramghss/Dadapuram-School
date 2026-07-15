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
      rollNumber, name, standard, section, gender, medium, photoUrl,
      tamilName, fatherName, dob, admissionNumber, religion, community, address
    } = req.body;

    if (!isAuthorizedForClass(req.dbUser, standard, section, true)) {
      return res.status(403).json({ error: 'Not authorized for full access to this class and section' });
    }

    const existingStudent = await Student.findOne({ rollNumber, standard, section });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student with this roll number already exists in this class section.' });
    }

    const newStudent = new Student({
      rollNumber,
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
      terms: [] // initialized empty
    });

    await newStudent.save();
    res.status(201).json({ success: true, data: newStudent });
  } catch (error) {
    console.error('Error adding student:', error);
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

    if (standard !== 'All' && section !== 'All' && !isAuthorizedForClass(req.dbUser, standard, section)) {
      return res.status(403).json({ error: 'Not authorized for this class and section' });
    }

    const query = {};
    if (standard !== 'All') query.standard = standard;
    if (section !== 'All') query.section = section;

    const students = await Student.find(query).sort({ rollNumber: 1 });
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error('Error fetching students:', error);
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

    await student.save();
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

module.exports = {
  addStudent,
  getStudentsByClass,
  updateStudentMarks,
  updateStudent,
  deleteStudent
};
