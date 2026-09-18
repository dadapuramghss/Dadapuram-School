const Timetable = require('../models/Timetable');
const ClassConfig = require('../models/ClassConfig');
const User = require('../models/User');

const workingDaysDefault = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class TimetableGenerator {
  constructor(configs, teachers, academicYear) {
    this.configs = configs;
    this.teachers = teachers;
    this.academicYear = academicYear;
    this.schedule = [];
    this.errors = [];
    this.conflicts = [];
    this.warnings = [];
    this.missingAssignments = [];
    this.ambiguousAssignments = [];
    this.missingClassTeachers = [];
    this.duplicateClassTeachers = [];
    
    // Quick lookups
    this.teacherSchedules = {}; // teacherId -> { day: { period: count } }
    this.teacherDailyCount = {}; // teacherId -> { day: count }
  }

  initTeacherTracking() {
    this.teachers.forEach(t => {
      this.teacherSchedules[t.uid] = {};
      this.teacherDailyCount[t.uid] = {};
      workingDaysDefault.forEach(d => {
        this.teacherSchedules[t.uid][d] = {};
        this.teacherDailyCount[t.uid][d] = 0;
      });
    });
  }

  checkTeacherConflict(teacherId, day, period) {
    if (!this.teacherSchedules[teacherId]) return false;
    if (!this.teacherSchedules[teacherId][day]) return false;
    return !!this.teacherSchedules[teacherId][day][period];
  }

  checkTeacherDailyLimit(teacherId, day) {
    if (!this.teacherDailyCount[teacherId]) return false;
    return this.teacherDailyCount[teacherId][day] >= 6;
  }

  assignTeacherSlot(teacherId, day, period) {
    if (!this.teacherSchedules[teacherId]) return;
    if (!this.teacherSchedules[teacherId][day]) this.teacherSchedules[teacherId][day] = {};
    this.teacherSchedules[teacherId][day][period] = true;
    
    if (!this.teacherDailyCount[teacherId]) this.teacherDailyCount[teacherId] = {};
    this.teacherDailyCount[teacherId][day] = (this.teacherDailyCount[teacherId][day] || 0) + 1;
  }

  unassignTeacherSlot(teacherId, day, period) {
    if (!this.teacherSchedules[teacherId]) return;
    if (this.teacherSchedules[teacherId][day]) {
      this.teacherSchedules[teacherId][day][period] = false;
      this.teacherDailyCount[teacherId][day]--;
    }
  }

  async run() {
    this.initTeacherTracking();

    // 1. Check Class Teacher constraints
    const classTeachersMap = {}; // std_sec -> array of { teacher, subject }
    const teacherToClass = {}; // teacherUid -> array of std_sec

    for (const t of this.teachers) {
      if (!t.assignedClasses) continue;
      for (const ac of t.assignedClasses) {
        if (ac.isClassTeacher) {
          const key = `${ac.standard}_${ac.section}`;
          if (!classTeachersMap[key]) classTeachersMap[key] = [];
          classTeachersMap[key].push({ teacher: t, subject: ac.subject });

          if (!teacherToClass[t.uid]) teacherToClass[t.uid] = [];
          if (!teacherToClass[t.uid].includes(key)) {
            teacherToClass[t.uid].push(key);
          }
        }
      }
    }

    // A teacher cannot be class teacher for multiple classes
    for (const [uid, classes] of Object.entries(teacherToClass)) {
      if (classes.length > 1) {
        const t = this.teachers.find(x => x.uid === uid);
        this.errors.push(`Class Teacher Conflict: ${t.name} is assigned as Class Teacher for ${classes.join(' and ')}. Both require Period 1.`);
      }
    }

    if (this.errors.length > 0) return { success: false, errors: this.errors };

    // 2. Prepare class requirements
    let classRequirements = []; // List of { standard, section, config, subjects: [{ name, teacher, freq, type }] }
    for (const config of this.configs) {
      const std = config.standard;
      const sec = config.section;
      const key = `${std}_${sec}`;
      
      const ctCandidates = classTeachersMap[key] || [];
      let finalClassTeacher = null;

      if (ctCandidates.length === 0) {
        this.missingClassTeachers.push({ standard: std, section: sec });
      } else if (ctCandidates.length > 1) {
        this.duplicateClassTeachers.push({
          standard: std, 
          section: sec, 
          teachers: ctCandidates.map(c => ({ name: c.teacher.name, uid: c.teacher.uid }))
        });
      } else {
        finalClassTeacher = ctCandidates[0];
      }
      
      let workingDays = config.timetableConfig?.workingDays?.length ? config.timetableConfig.workingDays : workingDaysDefault;
      let periodsPerDay = config.timetableConfig?.periodsPerDay || 8;
      
      let subjectReqs = [];
      
      // Determine frequencies
      let targetFrequencies = config.timetableConfig?.subjectFrequencies;
      if (!targetFrequencies || targetFrequencies.length === 0) {
        // Fallback: divide 48 periods roughly among subjects
        const baseSubjs = config.subjects || [];
        if (baseSubjs.length > 0) {
          const perSubj = Math.floor(48 / baseSubjs.length);
          targetFrequencies = baseSubjs.map(s => ({
            subjectName: s,
            weeklyPeriods: perSubj,
            type: s.toLowerCase() === 'pt' ? 'pt' : s.toLowerCase() === 'art' ? 'art' : 'subject'
          }));
        }
      }

      for (const req of (targetFrequencies || [])) {
        const targetStd = String(std).trim().toLowerCase();
        const targetSec = String(sec).trim().toLowerCase();
        const targetSubj = String(req.subjectName).trim().toLowerCase();

        // Find teachers for this subject in this class
        let priority1 = []; // Exact subject match
        let priority2 = []; // All Subjects match

        this.teachers.forEach(t => {
          if (!t.assignedClasses) return;
          t.assignedClasses.forEach(ac => {
            if (String(ac.standard).trim().toLowerCase() !== targetStd) return;
            if (String(ac.section).trim().toLowerCase() !== targetSec) return;
            
            if (!ac.subject || String(ac.subject).trim() === '') {
              priority2.push(t);
            } else if (String(ac.subject).trim().toLowerCase() === targetSubj) {
              priority1.push(t);
            }
          });
        });

        let selectedTeacher = null;

        if (priority1.length === 1) {
          selectedTeacher = priority1[0];
        } else if (priority1.length > 1) {
          this.ambiguousAssignments.push({
            standard: std,
            section: sec,
            subject: req.subjectName,
            reason: 'AMBIGUOUS_EXACT_SUBJECT_ASSIGNMENT',
            teachers: priority1.map(t => ({ uid: t.uid, name: t.name }))
          });
        } else if (priority2.length === 1) {
          selectedTeacher = priority2[0];
        } else if (priority2.length > 1) {
          this.ambiguousAssignments.push({
            standard: std,
            section: sec,
            subject: req.subjectName,
            reason: 'AMBIGUOUS_ALL_SUBJECT_ASSIGNMENT',
            teachers: priority2.map(t => ({ uid: t.uid, name: t.name }))
          });
        } else {
          this.missingAssignments.push({
            standard: std,
            section: sec,
            subject: req.subjectName
          });
        }

        if (selectedTeacher) {
          subjectReqs.push({
            subjectName: req.subjectName,
            subjectId: req.subjectId || req.subjectName,
            teacherId: selectedTeacher.uid,
            teacherName: selectedTeacher.name,
            weeklyPeriods: req.weeklyPeriods || 6,
            type: req.type || 'subject'
          });
        }
      }

      classRequirements.push({
        standard: std, section: sec,
        workingDays, periodsPerDay,
        subjects: subjectReqs,
        classTeacher: finalClassTeacher
      });
    }

    if (
      this.missingAssignments.length > 0 || 
      this.ambiguousAssignments.length > 0 ||
      this.missingClassTeachers.length > 0 ||
      this.duplicateClassTeachers.length > 0
    ) {
      return { 
        success: false, 
        code: 'TIMETABLE_SETUP_INCOMPLETE', 
        missingAssignments: this.missingAssignments,
        ambiguousAssignments: this.ambiguousAssignments,
        missingClassTeachers: this.missingClassTeachers,
        duplicateClassTeachers: this.duplicateClassTeachers
      };
    }

    if (this.errors.length > 0) return { success: false, errors: this.errors };

    // 3. Generate Timetable Class by Class
    for (const cls of classRequirements) {
      let classGrid = {}; // day -> period -> slot
      cls.workingDays.forEach(d => classGrid[d] = {});
      
      let success = this.scheduleClass(cls, classGrid);
      if (!success) {
        // If any class fails to fully schedule, we abort generation for the whole timetable.
        break;
      }

      // Commit grid to global schedule
      for (const d of Object.keys(classGrid)) {
        for (const p of Object.keys(classGrid[d])) {
          const slot = classGrid[d][p];
          if (slot) {
            this.schedule.push({
              academicYear: this.academicYear,
              day: d,
              period: parseInt(p),
              standard: cls.standard,
              section: cls.section,
              subjectId: slot.subjectId,
              subjectName: slot.subjectName,
              teacherId: slot.teacherId,
              teacherName: slot.teacherName,
              type: slot.type,
              status: 'draft'
            });
          }
        }
      }
    }

    if (this.conflicts.length > 0) {
      return { 
        success: false, 
        code: 'TIMETABLE_GENERATION_CONFLICT', 
        conflicts: this.conflicts 
      };
    }
    
    if (this.errors.length > 0) return { success: false, errors: this.errors };
    return { success: true, schedule: this.schedule, warnings: this.warnings };
  }

  scheduleClass(cls, grid) {
    const { workingDays, periodsPerDay, subjects, classTeacher } = cls;
    
    // Track what is scheduled
    let remaining = subjects.map(s => ({ ...s }));
    
    // Priority 1: Class Teacher P1
    if (classTeacher) {
      for (const d of workingDays) {
        const ctSubjReq = remaining.find(r => r.teacherId === classTeacher.teacher.uid && r.weeklyPeriods > 0);
        if (ctSubjReq) {
          if (this.checkTeacherConflict(ctSubjReq.teacherId, d, 1) || this.checkTeacherDailyLimit(ctSubjReq.teacherId, d)) {
            this.warnings.push(`Could not schedule Class Teacher for ${cls.standard}-${cls.section} on ${d} due to conflict.`);
            continue;
          }
          grid[d][1] = { ...ctSubjReq };
          this.assignTeacherSlot(ctSubjReq.teacherId, d, 1);
          ctSubjReq.weeklyPeriods--;
        } else {
          this.warnings.push(`Class Teacher ${classTeacher.teacher.name} has no available subjects for P1 on ${d} in ${cls.standard}-${cls.section}`);
        }
      }
    }

    // Helper to find slots
    const getAvailableSlots = (day) => {
      let slots = [];
      for (let p = 1; p <= periodsPerDay; p++) {
        if (!grid[day][p]) slots.push(p);
      }
      return slots;
    };

    const scheduleLanguage = (langName) => {
      const langReq = remaining.find(r => r.subjectName.toLowerCase() === langName.toLowerCase());
      if (!langReq) return true;

      for (const d of workingDays) {
        if (langReq.weeklyPeriods <= 0) break;
        
        let hasLang = false;
        for (let p = 1; p <= periodsPerDay; p++) {
          if (grid[d][p] && grid[d][p].subjectName.toLowerCase() === langName.toLowerCase()) {
            hasLang = true; break;
          }
        }
        
        if (hasLang) continue;

        let placed = false;
        const slots = getAvailableSlots(d);
        for (const p of slots) {
          if (!this.checkTeacherConflict(langReq.teacherId, d, p) && !this.checkTeacherDailyLimit(langReq.teacherId, d)) {
            grid[d][p] = { ...langReq };
            this.assignTeacherSlot(langReq.teacherId, d, p);
            langReq.weeklyPeriods--;
            placed = true;
            break;
          }
        }
        if (!placed) {
          this.warnings.push(`Failed to place language ${langName} on day ${d}`);
          continue;
        }
      }
      return true;
    };

    scheduleLanguage('Tamil');
    scheduleLanguage('English');

    const scheduleSpecial = (typeStr) => {
      const req = remaining.find(r => r.type === typeStr);
      if (!req) return true;
      
      let placedCount = 0;
      for (const d of workingDays) {
        if (req.weeklyPeriods <= 0) break;
        
        const slots = getAvailableSlots(d);
        for (const p of slots) {
          if (!this.checkTeacherConflict(req.teacherId, d, p) && !this.checkTeacherDailyLimit(req.teacherId, d)) {
            grid[d][p] = { ...req };
            this.assignTeacherSlot(req.teacherId, d, p);
            req.weeklyPeriods--;
            placedCount++;
            break;
          }
        }
      }
      if (req.weeklyPeriods > 0) {
        console.log(`Failed to place special subject ${typeStr}, remaining: ${req.weeklyPeriods}`);
      }
      return req.weeklyPeriods === 0;
    };

    scheduleSpecial('pt');
    scheduleSpecial('art');

    // Priority 4: Remaining subjects (Greedy approach)
    // To prevent the same subject 3 times a day, we sort subjects by remaining periods
    for (const d of workingDays) {
      const slots = getAvailableSlots(d);
      for (const p of slots) {
        // Find subject with highest remaining periods that is valid
        remaining.sort((a, b) => b.weeklyPeriods - a.weeklyPeriods);
        let placed = false;
        
        for (const req of remaining) {
          if (req.weeklyPeriods > 0) {
            if (!this.checkTeacherConflict(req.teacherId, d, p) && !this.checkTeacherDailyLimit(req.teacherId, d)) {
              grid[d][p] = { ...req };
              this.assignTeacherSlot(req.teacherId, d, p);
              req.weeklyPeriods--;
              placed = true;
              break;
            }
          }
        }
        // If not placed, it remains empty (a free slot for the class)
      }
    }

    // Check if any required periods are left (strict check could fail generation if they are)
    const unsatisfied = remaining.filter(r => r.weeklyPeriods > 0);
    if (unsatisfied.length > 0) {
      unsatisfied.forEach(u => {
        this.conflicts.push({
          type: 'UNSATISFIED_SUBJECT_PERIODS',
          standard: cls.standard,
          section: cls.section,
          subject: u.subjectName,
          teacher: u.teacherName,
          reason: `Could not schedule ${u.weeklyPeriods} required period(s) for ${u.subjectName} due to teacher constraints or full schedule.`
        });
      });
      return false; // Fail generation for the whole timetable
    }

    return true;
  }
}

exports.getTimetable = async (req, res) => {
  try {
    const { academicYear, standard, section, teacherId, status } = req.query;
    let query = {};
    if (academicYear) query.academicYear = academicYear;
    
    const role = req.dbUser ? req.dbUser.role : null;

    if (role === 'admin') {
      if (standard) query.standard = standard;
      if (section) query.section = section;
      if (teacherId) query.teacherId = teacherId;
      if (status) query.status = status;
    } else {
      // Non-admins can only see published timetables
      query.status = 'published';
      
      if (role === 'teacher') {
        // Teacher can only see their own timetable
        query.teacherId = req.dbUser.uid;
      } else if (role === 'student') {
        // Student can only see their own class's timetable
        query.standard = req.dbUser.standard;
        query.section = req.dbUser.section;
      } else {
        return res.status(403).json({ message: 'Forbidden: Unauthorized role' });
      }
    }

    const timetable = await Timetable.find(query).sort({ day: 1, period: 1 });
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateTimetable = async (req, res) => {
  try {
    const { academicYear = '2026-27' } = req.body;
    
    const configs = await ClassConfig.find();
    const teachers = await User.find({ role: 'teacher', status: 'approved', isActive: true });

    const generator = new TimetableGenerator(configs, teachers, academicYear);
    const result = await generator.run();

    if (!result.success) {
      if (result.code === 'TIMETABLE_SETUP_INCOMPLETE') {
        return res.status(400).json({ 
          error: 'Timetable setup incomplete', 
          code: 'TIMETABLE_SETUP_INCOMPLETE', 
          missingAssignments: result.missingAssignments,
          ambiguousAssignments: result.ambiguousAssignments,
          missingClassTeachers: result.missingClassTeachers,
          duplicateClassTeachers: result.duplicateClassTeachers
        });
      }
      if (result.code === 'TIMETABLE_GENERATION_CONFLICT') {
        return res.status(400).json({ 
          error: 'Timetable generation failed due to constraint conflicts', 
          code: 'TIMETABLE_GENERATION_CONFLICT', 
          conflicts: result.conflicts
        });
      }
      return res.status(400).json({ message: 'Generation failed due to conflicts', errors: result.errors });
    }

    // Delete existing drafts for this academic year
    await Timetable.deleteMany({ academicYear, status: 'draft' });

    // Insert new drafts
    if (result.schedule.length > 0) {
      await Timetable.insertMany(result.schedule);
    }

    res.json({
      message: 'Timetable generated successfully as draft',
      scheduleCount: result.schedule.length,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({ message: error.message, errors: [error.message] });
  }
};

exports.checkReadiness = async (req, res) => {
  try {
    const { academicYear = '2026-27' } = req.query;
    
    const configs = await ClassConfig.find();
    const teachers = await User.find({ role: 'teacher', status: 'approved', isActive: true });

    const generator = new TimetableGenerator(configs, teachers, academicYear);
    
    // Run only the setup phase
    generator.initTeacherTracking();
    
    // Simulate setup check logic manually or we can call run() and intercept it?
    // Run() will naturally stop at TIMETABLE_SETUP_INCOMPLETE
    const result = await generator.run();

    if (!result.success && result.code === 'TIMETABLE_SETUP_INCOMPLETE') {
      return res.json({ 
        ready: false,
        code: 'TIMETABLE_SETUP_INCOMPLETE', 
        missingAssignments: result.missingAssignments,
        ambiguousAssignments: result.ambiguousAssignments,
        missingClassTeachers: result.missingClassTeachers,
        duplicateClassTeachers: result.duplicateClassTeachers
      });
    }

    // If it passed setup, it started generation. We ignore the generated schedule.
    return res.json({ ready: true, code: 'READY' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.validateChange = async (req, res) => {
  try {
    const { academicYear, day, period, standard, section, teacherId, subjectName } = req.body;
    
    // Check class conflict
    const classConflict = await Timetable.findOne({ academicYear, day, period, standard, section, status: 'draft' });
    if (classConflict && classConflict.teacherId !== teacherId) {
      return res.status(400).json({ message: `Class Conflict: ${standard}-${section} already has a subject at Period ${period}.` });
    }

    // Check teacher conflict
    const teacherConflict = await Timetable.findOne({ academicYear, day, period, teacherId, status: 'draft' });
    if (teacherConflict && !(teacherConflict.standard === standard && teacherConflict.section === section)) {
      return res.status(400).json({ message: `Teacher Conflict: Teacher is already teaching ${teacherConflict.standard}-${teacherConflict.section} during Period ${period}.` });
    }

    // Check teacher daily limit (max 6)
    const dailySlots = await Timetable.countDocuments({ academicYear, day, teacherId, status: 'draft' });
    if (dailySlots >= 6 && (!teacherConflict || teacherConflict.standard !== standard)) {
      return res.status(400).json({ message: `Teacher Daily Limit: This change would give the teacher > 6 teaching periods on ${day}. Maximum allowed: 6.` });
    }

    // Tamil/English rules
    if (subjectName.toLowerCase() === 'tamil' || subjectName.toLowerCase() === 'english') {
      const existingLang = await Timetable.findOne({ academicYear, day, standard, section, subjectName: new RegExp(`^${subjectName}$`, 'i'), status: 'draft' });
      if (existingLang && existingLang.period !== period) {
         return res.status(400).json({ message: `${subjectName} Conflict: ${subjectName} is already scheduled for ${standard}-${section} on ${day}.` });
      }
    }

    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTimetableSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // We assume validateChange was called before this by the frontend
    const slot = await Timetable.findByIdAndUpdate(id, updates, { new: true });
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    res.json(slot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.publishTimetable = async (req, res) => {
  try {
    const { academicYear } = req.body;
    
    // Optional: Run full validation pass here to ensure draft is perfectly valid before publish.
    
    // 1. Delete currently published
    await Timetable.deleteMany({ academicYear, status: 'published' });
    
    // 2. Mark drafts as published
    await Timetable.updateMany({ academicYear, status: 'draft' }, { $set: { status: 'published' } });

    res.json({ message: 'Timetable published successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.TimetableGenerator = TimetableGenerator;
