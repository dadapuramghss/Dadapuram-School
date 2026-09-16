const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { sortStudentsByGenderAndName } = require('../utils/sortUtils');
const mongoose = require('mongoose');

exports.getAttendance = async (req, res) => {
  try {
    const { date, standard, section, period, attendanceType = 'period' } = req.query;

    if (!date || !standard || !section) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }
    
    if (attendanceType === 'period' && !period) {
      return res.status(400).json({ error: 'Missing period parameter for period attendance' });
    }

    const query = {
      date,
      standard,
      section,
      attendanceType
    };

    if (attendanceType === 'period') {
      query.period = Number(period);
    }

    const attendance = await Attendance.findOne(query).populate('records.student', 'name emisNumber gender');

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
    const { date, standard, section, period, records, isSubmitted, attendanceType = 'period' } = req.body;

    if (!date || !standard || !section || !records) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (attendanceType === 'period' && !period) {
      return res.status(400).json({ error: 'Missing period field for period attendance' });
    }

    const query = {
      date,
      standard,
      section,
      attendanceType
    };

    if (attendanceType === 'period') {
      query.period = Number(period);
    }

    let attendance = await Attendance.findOne(query);

    if (attendance && attendance.isSubmitted) {
      if (req.dbUser && req.dbUser.role !== 'admin') {
        return res.status(403).json({ error: 'Attendance has already been submitted and is locked for editing.' });
      }
    }

    if (!attendance) {
      attendance = new Attendance(query);
    }

    attendance.records = records;
    
    if (isSubmitted) {
      attendance.isSubmitted = true;
      if (req.dbUser) attendance.submittedBy = req.dbUser._id; 
    }

    await attendance.save();

    // DAILY -> PERIOD 1 SYNCHRONIZATION
    if (attendanceType === 'daily') {
      const period1Query = {
        date,
        standard,
        section,
        attendanceType: 'period',
        period: 1
      };
      
      let period1Attendance = await Attendance.findOne(period1Query);
      if (!period1Attendance) {
        period1Attendance = new Attendance(period1Query);
      }
      
      period1Attendance.records = records.map(r => ({
        student: r.student._id ? r.student._id : r.student,
        status: r.status,
        remarks: r.remarks
      }));
      
      period1Attendance.isSubmitted = attendance.isSubmitted;
      period1Attendance.submittedBy = attendance.submittedBy;
      
      await period1Attendance.save();
    }

    // Emit live update to all clients
    if (req.io) {
      req.io.emit('liveAttendanceUpdate', {
        standard,
        section,
        date,
        period: attendanceType === 'period' ? period : null,
        attendanceType
      });
    }

    res.json({ message: 'Attendance saved successfully', attendance });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const { date, standard, section, period, attendanceType = 'period' } = req.query;
    
    if (!date || !standard || !section) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }
    
    if (req.dbUser && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete attendance.' });
    }
    
    const query = {
      date,
      standard,
      section,
      attendanceType
    };

    if (attendanceType === 'period') {
      if (!period) return res.status(400).json({ error: 'Missing period' });
      query.period = Number(period);
    }
    
    await Attendance.deleteOne(query);
    
    // Note: Do NOT delete period attendance when deleting daily attendance, per requirements.
    
    res.json({ success: true, message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
}

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
        daily: '-',
        periods: { 1: '-', 2: '-', 3: '-', 4: '-', 5: '-', 6: '-', 7: '-', 8: '-' }
      };
    });

    attendances.forEach(att => {
      att.records.forEach(r => {
        const stuId = r.student._id ? r.student._id.toString() : r.student.toString();
        if (summaryMap[stuId]) {
          const statusChar = r.status === 'Present' ? 'P' : (r.status === 'Absent' ? 'A' : 'L');
          if (att.attendanceType === 'daily') {
            summaryMap[stuId].daily = statusChar;
          } else if (att.attendanceType === 'period') {
            summaryMap[stuId].periods[att.period] = statusChar;
          }
        }
      });
    });

    res.json(Object.values(summaryMap));
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
};

exports.bulkImportDailyAttendance = async (req, res) => {
  try {
    const records = req.body; // array of { emisNumber, date, standard, section, status }
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No records provided' });
    }
    
    // 1. Validation phase
    const errors = [];
    const emisNumbers = [...new Set(records.map(r => String(r.emisNumber).trim()))];
    const students = await Student.find({ emisNumber: { $in: emisNumbers } });
    const studentMap = {};
    students.forEach(s => {
      studentMap[s.emisNumber] = s;
    });
    
    const duplicateCheckMap = new Set();
    
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;
      
      const emis = String(row.emisNumber).trim();
      const date = String(row.date).trim();
      const std = String(row.standard).trim();
      const sec = String(row.section).trim().toUpperCase();
      const status = String(row.status).trim();
      
      if (!emis) { errors.push(`Row ${rowNum}: EMIS Number is missing.`); continue; }
      if (!date) { errors.push(`Row ${rowNum}: Date is missing.`); continue; }
      if (!['Present', 'Absent'].includes(status)) { errors.push(`Row ${rowNum}: Invalid status "${status}". Allowed: Present, Absent.`); continue; }
      
      const student = studentMap[emis];
      if (!student) {
        errors.push(`Row ${rowNum}: Student with EMIS ${emis} not found.`);
        continue;
      }
      
      if (student.standard !== std) {
        errors.push(`Row ${rowNum}: EMIS ${emis} belongs to Standard ${student.standard}, but Excel says ${std}.`);
        continue;
      }
      
      if (student.section !== sec) {
        errors.push(`Row ${rowNum}: EMIS ${emis} belongs to Section ${student.section}, but Excel says ${sec}.`);
        continue;
      }
      
      const dupKey = `${emis}-${date}-${std}-${sec}`;
      if (duplicateCheckMap.has(dupKey)) {
        errors.push(`Row ${rowNum}: Duplicate attendance entry for EMIS ${emis} on Date ${date}.`);
        continue;
      }
      duplicateCheckMap.add(dupKey);
      
      // enrich row with student ID for processing
      row.studentId = student._id;
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. No records were imported.',
        errors
      });
    }
    
    // 2. Processing phase - group by Date + Standard + Section
    const grouped = {};
    records.forEach(row => {
      const key = `${row.date}_${row.standard}_${row.section.toUpperCase()}`;
      if (!grouped[key]) {
        grouped[key] = {
          date: row.date,
          standard: row.standard,
          section: row.section.toUpperCase(),
          studentStatuses: []
        };
      }
      grouped[key].studentStatuses.push({
        student: row.studentId,
        status: row.status
      });
    });
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const key in grouped) {
      const group = grouped[key];
      
      // Process Daily Attendance
      const query = {
        date: group.date,
        standard: group.standard,
        section: group.section,
        attendanceType: 'daily'
      };
      
      let dailyAttendance = await Attendance.findOne(query);
      if (dailyAttendance) {
        // update existing student records
        const recordMap = new Map();
        dailyAttendance.records.forEach(r => recordMap.set(r.student.toString(), r.status));
        
        group.studentStatuses.forEach(ss => {
          recordMap.set(ss.student.toString(), ss.status);
        });
        
        dailyAttendance.records = Array.from(recordMap.entries()).map(([studentId, status]) => ({
          student: studentId,
          status
        }));
        
        await dailyAttendance.save();
        updatedCount++;
      } else {
        // create new
        dailyAttendance = new Attendance({
          ...query,
          isSubmitted: true,
          submittedBy: req.dbUser ? req.dbUser._id : null,
          records: group.studentStatuses
        });
        await dailyAttendance.save();
        createdCount++;
      }
      
      // Process Period 1 Sync
      const p1Query = { ...query, attendanceType: 'period', period: 1 };
      let p1Attendance = await Attendance.findOne(p1Query);
      if (p1Attendance) {
        const p1RecordMap = new Map();
        p1Attendance.records.forEach(r => p1RecordMap.set(r.student.toString(), r.status));
        group.studentStatuses.forEach(ss => p1RecordMap.set(ss.student.toString(), ss.status));
        p1Attendance.records = Array.from(p1RecordMap.entries()).map(([studentId, status]) => ({
          student: studentId,
          status
        }));
        await p1Attendance.save();
      } else {
        p1Attendance = new Attendance({
          ...p1Query,
          isSubmitted: true,
          submittedBy: req.dbUser ? req.dbUser._id : null,
          records: group.studentStatuses
        });
        await p1Attendance.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk import successful',
      data: { created: createdCount, updated: updatedCount }
    });
    
  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({ success: false, message: 'Internal server error during bulk import' });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const { fromDate, toDate, standard, section, percentage } = req.query;
    
    // Base match for daily attendance
    const matchStage = {
      attendanceType: 'daily',
      isSubmitted: true
    };
    
    if (fromDate || toDate) {
      matchStage.date = {};
      // assuming date is YYYY-MM-DD or comparable string. 
      // If it's stored as DD/MM/YYYY, this string comparison might be inaccurate!
      // Looking at the code `new Date().toISOString().split('T')[0]`, it's YYYY-MM-DD.
      if (fromDate) matchStage.date.$gte = fromDate;
      if (toDate) matchStage.date.$lte = toDate;
    }
    
    if (standard && standard !== 'All') {
      matchStage.standard = standard;
    }
    if (section && section !== 'All') {
      matchStage.section = section;
    }

    const attendances = await Attendance.find(matchStage).lean();
    
    // We also need all students for the selected class/section to show them even if 0 days
    const studentQuery = {};
    if (standard && standard !== 'All') studentQuery.standard = standard;
    if (section && section !== 'All') studentQuery.section = section;
    
    let students = await Student.find(studentQuery).lean();
    students = sortStudentsByGenderAndName(students);
    
    const reportMap = {};
    students.forEach(s => {
      reportMap[s._id.toString()] = {
        studentId: s._id,
        emisNumber: s.emisNumber,
        name: s.name,
        standard: s.standard,
        section: s.section,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        percentage: 0
      };
    });
    
    attendances.forEach(att => {
      att.records.forEach(r => {
        const sId = r.student.toString();
        if (reportMap[sId]) {
          reportMap[sId].totalDays += 1;
          if (r.status === 'Present') {
            reportMap[sId].presentDays += 1;
          } else {
            reportMap[sId].absentDays += 1;
          }
        }
      });
    });
    
    // Calculate percentage and filter
    let reportArray = Object.values(reportMap);
    
    reportArray.forEach(row => {
      if (row.totalDays > 0) {
        row.percentage = Math.round((row.presentDays / row.totalDays) * 100);
      } else {
        row.percentage = 0;
      }
    });
    
    if (percentage && percentage !== 'All') {
      if (percentage === '90% and Above') {
        reportArray = reportArray.filter(r => r.percentage >= 90);
      } else if (percentage === '80%–89%') {
        reportArray = reportArray.filter(r => r.percentage >= 80 && r.percentage < 90);
      } else if (percentage === '75%–79%') {
        reportArray = reportArray.filter(r => r.percentage >= 75 && r.percentage < 80);
      } else if (percentage === 'Below 75%') {
        reportArray = reportArray.filter(r => r.percentage < 75);
      }
    }
    
    res.json({ success: true, data: reportArray });
  } catch (error) {
    console.error('Error in getAttendanceReport:', error);
    res.status(500).json({ success: false, message: 'Failed to generate attendance report' });
  }
};

exports.exportDailyAttendance = async (req, res) => {
  try {
    const { fromDate, toDate, standard, section } = req.query;
    
    const matchStage = {
      attendanceType: 'daily',
      isSubmitted: true
    };
    
    if (fromDate || toDate) {
      matchStage.date = {};
      if (fromDate) matchStage.date.$gte = fromDate;
      if (toDate) matchStage.date.$lte = toDate;
    }
    
    if (standard && standard !== 'All') matchStage.standard = standard;
    if (section && section !== 'All') matchStage.section = section;
    
    const attendances = await Attendance.find(matchStage).populate('records.student', 'name emisNumber gender').lean();
    
    const exportData = [];
    
    attendances.forEach(att => {
      att.records.forEach(r => {
        if (r.student) {
          exportData.push({
            Date: att.date,
            'EMIS Number': r.student.emisNumber,
            'Student Name': r.student.name,
            Standard: att.standard,
            Section: att.section,
            Status: r.status,
            gender: r.student.gender // Keep it for sorting, remove it later if necessary, or just use it during sort
          });
        }
      });
    });
    
    // Sort by Date, then Standard, then Section, then Gender/Name
    exportData.sort((a, b) => {
      if (a.Date !== b.Date) return a.Date.localeCompare(b.Date);
      if (a.Standard !== b.Standard) return String(a.Standard).localeCompare(String(b.Standard));
      if (a.Section !== b.Section) return a.Section.localeCompare(b.Section);
      
      const priority = { 'Male': 1, 'Female': 2 };
      const pA = priority[a.gender] || 3;
      const pB = priority[b.gender] || 3;
      
      if (pA !== pB) return pA - pB;
      
      return (a['Student Name'] || '').localeCompare(b['Student Name'] || '', 'en', { sensitivity: 'base' });
    });
    
    // Clean up gender field from exportData so it doesn't show in Excel
    exportData.forEach(row => delete row.gender);
    
    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error('Error exporting daily attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to export attendance' });
  }
};

exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { standard, section, year, month } = req.query;
    if (!standard || !section || !year || !month) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    // Authorization
    let allowedClasses = null;
    if (req.dbUser && req.dbUser.role !== 'admin') {
      if (!req.dbUser.assignedClasses || req.dbUser.assignedClasses.length === 0) {
        return res.status(403).json({ error: 'Not authorized for any classes' });
      }
      allowedClasses = req.dbUser.assignedClasses;
    }

    const matchStage = { attendanceType: 'daily' };

    if (allowedClasses) {
      if (standard === 'All' && section === 'All') {
        matchStage.$or = allowedClasses.map(c => ({ standard: c.standard, section: c.section }));
      } else if (standard !== 'All' && section === 'All') {
        const matchingClasses = allowedClasses.filter(c => c.standard === standard);
        if (matchingClasses.length === 0) return res.status(403).json({ error: 'Not authorized for this standard' });
        matchStage.$or = matchingClasses.map(c => ({ standard: c.standard, section: c.section }));
      } else if (standard !== 'All' && section !== 'All') {
        const isAllowed = allowedClasses.some(c => c.standard === standard && c.section === section);
        if (!isAllowed) return res.status(403).json({ error: 'Not authorized for this class section' });
        matchStage.standard = standard;
        matchStage.section = section;
      } else {
        return res.status(400).json({ error: 'Invalid standard/section combination' });
      }
    } else {
      if (standard !== 'All') matchStage.standard = standard;
      if (section !== 'All') matchStage.section = section;
    }

    const yr = parseInt(year);
    if (month === 'All') {
      const startDate = `${yr}-01-01`;
      const endDate = `${yr + 1}-01-01`;
      matchStage.date = { $gte: startDate, $lt: endDate };
    } else {
      const mn = parseInt(month);
      const startDate = `${yr}-${String(mn).padStart(2, '0')}-01`;
      let nextYr = yr;
      let nextMn = mn + 1;
      if (nextMn > 12) {
        nextMn = 1;
        nextYr++;
      }
      const endDate = `${nextYr}-${String(nextMn).padStart(2, '0')}-01`;
      matchStage.date = { $gte: startDate, $lt: endDate };
    }

    const attendances = await Attendance.find(matchStage).populate('records.student', 'name emisNumber gender').lean();

    res.json({ success: true, data: attendances });
  } catch (error) {
    console.error('Error fetching monthly attendance:', error);
    res.status(500).json({ error: 'Failed to fetch monthly attendance' });
  }
};

exports.bulkImportMonthlyAttendance = async (req, res) => {
  try {
    const records = req.body; // array of { emisNumber, standard, section, date, status }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No records provided' });
    }

    // Authorization Check
    let allowedClasses = null;
    if (req.dbUser && req.dbUser.role !== 'admin') {
      if (!req.dbUser.assignedClasses || req.dbUser.assignedClasses.length === 0) {
        return res.status(403).json({ success: false, message: 'Not authorized for any classes' });
      }
      allowedClasses = req.dbUser.assignedClasses;
    }

    // 1. Validation phase
    const errors = [];
    const emisNumbers = [...new Set(records.map(r => String(r.emisNumber).trim()))];
    const students = await Student.find({ emisNumber: { $in: emisNumbers } });
    const studentMap = {};
    students.forEach(s => {
      studentMap[s.emisNumber] = s;
    });

    const duplicateCheckMap = new Set();
    const validStatuses = ['Present', 'Absent', 'Late', 'Homebased', 'IE Center', 'On Duty'];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;

      const emis = String(row.emisNumber).trim();
      const date = String(row.date).trim();
      const std = String(row.standard).trim();
      const sec = String(row.section).trim().toUpperCase();
      let status = String(row.status).trim();

      if (!emis) { errors.push(`Row ${rowNum}: EMIS Number is missing.`); continue; }
      if (!date) { errors.push(`Row ${rowNum}: Date is missing.`); continue; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push(`Row ${rowNum}: Date ${date} is invalid. Must be YYYY-MM-DD.`);
        continue;
      }

      // Normalize status
      const sMap = {
        'P': 'Present', 'PRESENT': 'Present',
        'A': 'Absent', 'ABSENT': 'Absent',
        'L': 'Late', 'LATE': 'Late',
        'H': 'Homebased', 'HOMEBASED': 'Homebased',
        'I': 'IE Center', 'IE CENTER': 'IE Center', 'IECENTER': 'IE Center',
        'OD': 'On Duty', 'ON DUTY': 'On Duty', 'ONDUTY': 'On Duty'
      };
      
      const normalizedStatus = sMap[status.toUpperCase()];
      if (normalizedStatus) {
        status = normalizedStatus;
        records[i].status = status; // update record
      }

      if (!validStatuses.includes(status)) { 
        errors.push(`Row ${rowNum}: Invalid status "${status}". Allowed: P, A, L, H, I, OD.`); 
        continue; 
      }

      const student = studentMap[emis];
      if (!student) {
        errors.push(`Row ${rowNum}: Student with EMIS ${emis} not found.`);
        continue;
      }

      if (student.standard !== std) {
        errors.push(`Row ${rowNum}: EMIS ${emis} belongs to Standard ${student.standard}, but Excel says ${std}.`);
        continue;
      }

      if (student.section !== sec) {
        errors.push(`Row ${rowNum}: EMIS ${emis} belongs to Section ${student.section}, but Excel says ${sec}.`);
        continue;
      }

      if (allowedClasses) {
        const isAllowed = allowedClasses.some(c => c.standard === std && c.section === sec);
        if (!isAllowed) {
          errors.push(`Row ${rowNum}: Not authorized to import attendance for Standard ${std} Section ${sec}.`);
          continue;
        }
      }

      const dupKey = `${emis}-${date}-${std}-${sec}`;
      if (duplicateCheckMap.has(dupKey)) {
        errors.push(`Row ${rowNum}: Duplicate attendance entry for EMIS ${emis} on Date ${date}.`);
        continue;
      }
      duplicateCheckMap.add(dupKey);

      row.studentId = student._id;
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. No records were imported.',
        validationErrors: errors
      });
    }

    // 2. Processing phase - group by Date + Standard + Section
    const grouped = {};
    records.forEach(row => {
      const key = `${row.date}_${row.standard}_${row.section.toUpperCase()}`;
      if (!grouped[key]) {
        grouped[key] = {
          date: row.date,
          standard: row.standard,
          section: row.section.toUpperCase(),
          studentStatuses: []
        };
      }
      grouped[key].studentStatuses.push({
        student: row.studentId,
        status: row.status
      });
    });

    let createdCount = 0;
    let updatedCount = 0;

    for (const key in grouped) {
      const group = grouped[key];

      // Process Daily Attendance
      const query = {
        date: group.date,
        standard: group.standard,
        section: group.section,
        attendanceType: 'daily'
      };

      let dailyAttendance = await Attendance.findOne(query);
      if (dailyAttendance) {
        const recordMap = new Map();
        dailyAttendance.records.forEach(r => recordMap.set(r.student.toString(), r.status));

        group.studentStatuses.forEach(ss => {
          recordMap.set(ss.student.toString(), ss.status);
        });

        dailyAttendance.records = Array.from(recordMap.entries()).map(([studentId, status]) => ({
          student: studentId,
          status
        }));

        await dailyAttendance.save();
        updatedCount++;
      } else {
        dailyAttendance = new Attendance({
          ...query,
          isSubmitted: true,
          submittedBy: req.dbUser ? req.dbUser._id : null,
          records: group.studentStatuses
        });
        await dailyAttendance.save();
        createdCount++;
      }

      // Process Period 1 Sync
      const p1Query = { ...query, attendanceType: 'period', period: 1 };
      let p1Attendance = await Attendance.findOne(p1Query);
      if (p1Attendance) {
        const p1RecordMap = new Map();
        p1Attendance.records.forEach(r => p1RecordMap.set(r.student.toString(), r.status));
        group.studentStatuses.forEach(ss => p1RecordMap.set(ss.student.toString(), ss.status));
        p1Attendance.records = Array.from(p1RecordMap.entries()).map(([studentId, status]) => ({
          student: studentId,
          status
        }));
        await p1Attendance.save();
      } else {
        p1Attendance = new Attendance({
          ...p1Query,
          isSubmitted: true,
          submittedBy: req.dbUser ? req.dbUser._id : null,
          records: group.studentStatuses
        });
        await p1Attendance.save();
      }
    }

    res.json({
      success: true,
      message: 'Monthly attendance imported successfully',
      data: { created: createdCount, updated: updatedCount }
    });

  } catch (error) {
    console.error('Error in bulk import monthly attendance:', error);
    res.status(500).json({ success: false, message: 'Internal server error during monthly bulk import' });
  }
};

exports.getDateRangeAttendance = async (req, res) => {
  try {
    const { fromDate, toDate, standard, section, percentageCondition, percentageValue } = req.query;

    if (!fromDate || !toDate || fromDate > toDate) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    // 1. Authorization
    let allowedClasses = null;
    if (req.dbUser && req.dbUser.role !== 'admin') {
      if (!req.dbUser.assignedClasses || req.dbUser.assignedClasses.length === 0) {
        return res.status(403).json({ error: 'Not authorized for any classes' });
      }
      allowedClasses = req.dbUser.assignedClasses;
    }

    // 2. Build match queries for Student and Attendance
    const matchStage = { attendanceType: 'daily', isSubmitted: true, date: { $gte: fromDate, $lte: toDate } };
    const studentQuery = {};

    if (allowedClasses) {
      if (standard === 'All' && section === 'All') {
        studentQuery.$or = allowedClasses.map(c => ({ standard: c.standard, section: c.section }));
        matchStage.$or = allowedClasses.map(c => ({ standard: c.standard, section: c.section }));
      } else if (standard !== 'All' && section === 'All') {
        const matchingClasses = allowedClasses.filter(c => c.standard === standard);
        if (matchingClasses.length === 0) return res.status(403).json({ error: 'Not authorized for this standard' });
        studentQuery.$or = matchingClasses.map(c => ({ standard: c.standard, section: c.section }));
        matchStage.$or = matchingClasses.map(c => ({ standard: c.standard, section: c.section }));
      } else if (standard !== 'All' && section !== 'All') {
        const isAllowed = allowedClasses.some(c => c.standard === standard && c.section === section);
        if (!isAllowed) return res.status(403).json({ error: 'Not authorized for this class section' });
        studentQuery.standard = standard;
        studentQuery.section = section;
        matchStage.standard = standard;
        matchStage.section = section;
      } else {
        return res.status(400).json({ error: 'Invalid standard/section combination' });
      }
    } else {
      if (standard && standard !== 'All') {
        studentQuery.standard = standard;
        matchStage.standard = standard;
      }
      if (section && section !== 'All') {
        studentQuery.section = section;
        matchStage.section = section;
      }
    }

    // 3. Fetch students and attendances
    let students = await Student.find(studentQuery).lean();
    students = sortStudentsByGenderAndName(students);
    const attendances = await Attendance.find(matchStage).lean();

    // 4. Generate all dates in the range
    const generatedDates = [];
    let curr = new Date(fromDate);
    const end = new Date(toDate);
    // Safety limit to prevent infinite loop or huge arrays on bad input (max 366 days)
    let safetyCounter = 0;
    while (curr <= end && safetyCounter < 366) {
      generatedDates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
      safetyCounter++;
    }

    const reportMap = {};
    students.forEach(s => {
      reportMap[s._id.toString()] = {
        studentId: s._id,
        emisNumber: s.emisNumber,
        name: s.name,
        gender: s.gender,
        standard: s.standard,
        section: s.section,
        attendanceByDate: {},
        presentDays: 0,
        absentDays: 0,
        totalDays: 0,
        percentage: 0
      };
      
      // Initialize all generated dates with '-'
      generatedDates.forEach(d => {
        reportMap[s._id.toString()].attendanceByDate[d] = '-';
      });
    });

    // Populate attendance records
    attendances.forEach(att => {
      att.records.forEach(r => {
        const sId = r.student.toString();
        if (reportMap[sId] && reportMap[sId].attendanceByDate.hasOwnProperty(att.date)) {
          reportMap[sId].totalDays += 1;
          const status = r.status;
          
          let statusChar = status;
          if (status === 'Present') statusChar = 'P';
          else if (status === 'Absent') statusChar = 'A';
          else if (status === 'Late') statusChar = 'L';
          else if (status === 'Homebased') statusChar = 'H';
          else if (status === 'IE Center') statusChar = 'I';
          else if (status === 'On Duty') statusChar = 'OD';
          
          reportMap[sId].attendanceByDate[att.date] = statusChar;
          
          if (status === 'Present') {
            reportMap[sId].presentDays += 1;
          } else {
            reportMap[sId].absentDays += 1;
          }
        }
      });
    });

    let reportArray = Object.values(reportMap);
    
    // 5. Calculate unfiltered summary
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalStudentsCount = reportArray.length;

    reportArray.forEach(row => {
      if (row.totalDays > 0) {
        row.percentage = Number(((row.presentDays / row.totalDays) * 100).toFixed(2));
      } else {
        row.percentage = 0;
      }
      totalPresent += row.presentDays;
      totalAbsent += row.absentDays;
    });

    const totalDaysRecorded = totalPresent + totalAbsent;
    const averageAttendance = totalDaysRecorded > 0 ? ((totalPresent / totalDaysRecorded) * 100).toFixed(1) + '%' : '0%';
    
    const summary = {
      totalStudents: totalStudentsCount,
      totalPresent,
      totalAbsent,
      averageAttendance
    };

    // 6. Apply Percentage Filter
    if (percentageCondition && percentageCondition !== 'No Filter' && percentageValue) {
      const pVal = parseFloat(percentageValue);
      if (!isNaN(pVal)) {
        if (percentageCondition === 'Above / Equal') {
          reportArray = reportArray.filter(r => r.percentage >= pVal);
        } else if (percentageCondition === 'Below / Equal') {
          reportArray = reportArray.filter(r => r.percentage <= pVal);
        }
      }
    }

    res.json({
      success: true,
      summary,
      dates: generatedDates,
      students: reportArray
    });

  } catch (error) {
    console.error('Error in getDateRangeAttendance:', error);
    res.status(500).json({ error: 'Failed to generate date range report' });
  }
};
