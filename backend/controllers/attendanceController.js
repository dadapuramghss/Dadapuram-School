const Attendance = require('../models/Attendance');

exports.getAttendance = async (req, res) => {
  try {
    const { date, standard, section, period } = req.query;

    if (!date || !standard || !section || !period) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    const attendance = await Attendance.findOne({
      date,
      standard,
      section,
      period: Number(period)
    }).populate('records.student', 'name emisNumber');

    if (!attendance) {
      return res.json({ records: [], isSubmitted: false });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

exports.saveAttendance = async (req, res) => {
  try {
    const { date, standard, section, period, records, isSubmitted } = req.body;

    if (!date || !standard || !section || !period || !records) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let attendance = await Attendance.findOne({
      date,
      standard,
      section,
      period: Number(period)
    });

    if (attendance && attendance.isSubmitted) {
      // If already submitted, only admin can edit
      if (req.dbUser.role !== 'admin') {
        return res.status(403).json({ error: 'Attendance has already been submitted and is locked for editing.' });
      }
    }

    if (!attendance) {
      attendance = new Attendance({
        date,
        standard,
        section,
        period: Number(period)
      });
    }

    attendance.records = records;
    
    // If we are submitting it now, mark it and record who submitted
    if (isSubmitted) {
      attendance.isSubmitted = true;
      attendance.submittedBy = req.dbUser._id; 
    }

    await attendance.save();

    // Emit live update to all clients
    if (req.io) {
      req.io.emit('liveAttendanceUpdate', {
        standard,
        section,
        date,
        period
      });
    }

    res.json({ message: 'Attendance saved successfully', attendance });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
};

const Student = require('../models/Student');
const { sortStudentsByGenderAndName } = require('../utils/sortUtils');

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { standard, section, date } = req.query;

    if (!standard || !section || !date) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    let students = await Student.find({ standard, section });
    students = sortStudentsByGenderAndName(students);

    const attendances = await Attendance.find({
      standard,
      section,
      date,
      isSubmitted: true
    });

    const summaryMap = {};
    students.forEach(s => {
      summaryMap[s._id.toString()] = {
        _id: s._id,
        name: s.name,
        emisNumber: s.emisNumber,
        periods: { 1: '-', 2: '-', 3: '-', 4: '-', 5: '-', 6: '-', 7: '-', 8: '-' }
      };
    });

    attendances.forEach(att => {
      const p = att.period;
      att.records.forEach(r => {
        const stuId = r.student._id ? r.student._id.toString() : r.student.toString();
        if (summaryMap[stuId]) {
          summaryMap[stuId].periods[p] = r.status === 'Present' ? 'P' : (r.status === 'Absent' ? 'A' : 'L');
        }
      });
    });

    res.json(Object.values(summaryMap));
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
};
