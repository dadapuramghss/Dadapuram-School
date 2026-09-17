require('dotenv').config();
const dns = require('dns');
if (process.platform === 'win32') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}
const mongoose = require('mongoose');
const User = require('./models/User');
const ClassConfig = require('./models/ClassConfig');
const Timetable = require('./models/Timetable');
const fs = require('fs');

// We have to mock the controllers since we are importing it, wait, we can just require the file.
// But timetableController might not expose the generator class directly.
// Let's copy the generator logic or we can just hit the APIs if we had a token, but doing it via DB is easier for mocking.
// Actually, I can just modify timetableController to export TimetableGenerator for testing.

async function runTests() {
  console.log("=== STARTING TIMETABLE VERIFICATION ===");
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edupulse';
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    // We will just read the timetableController file, extract the class, and eval it, or we can use the API.
    // Let's use the DB to create a test scenario and hit the generator via the controller method.
    // To do that without express, we mock req, res.

    const { validateChange, TimetableGenerator } = require('./controllers/timetableController');

    // 1. Setup Data
    const testStandard = 'TEST99';
    const testSection = 'Z';
    
    // Clear old test data
    await User.deleteMany({ email: /@testschool\.com/ });
    await ClassConfig.deleteMany({ standard: testStandard });
    await Timetable.deleteMany({ standard: testStandard });

    const teacher1 = await User.create({
      uid: 'test_t1', email: 't1@testschool.com', name: 'Teacher 1', role: 'teacher', status: 'approved', isActive: true,
      assignedClasses: [
        { standard: testStandard, section: testSection, subject: 'Tamil', isClassTeacher: true, accessLevel: 'full' },
        { standard: testStandard, section: testSection, subject: 'PT', isClassTeacher: false, accessLevel: 'full' }
      ]
    });

    const teacher2 = await User.create({
      uid: 'test_t2', email: 't2@testschool.com', name: 'Teacher 2', role: 'teacher', status: 'approved', isActive: true,
      assignedClasses: [
        { standard: testStandard, section: testSection, subject: 'English', isClassTeacher: false, accessLevel: 'full' },
        { standard: testStandard, section: testSection, subject: 'Maths', isClassTeacher: false, accessLevel: 'full' }
      ]
    });
    
    const teacher3 = await User.create({
      uid: 'test_t3', email: 't3@testschool.com', name: 'Teacher 3', role: 'teacher', status: 'approved', isActive: true,
      assignedClasses: [
        { standard: testStandard, section: testSection, subject: 'Science', isClassTeacher: false, accessLevel: 'full' }
      ]
    });

    const mockClassConfig = {
      standard: testStandard,
      section: testSection,
      subjects: ['Tamil', 'English', 'Maths', 'Science', 'PT'],
      timetableConfig: {
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        periodsPerDay: 8,
        subjectFrequencies: [
          { subjectId: 'Tamil', subjectName: 'Tamil', weeklyPeriods: 5, type: 'subject' },
          { subjectId: 'English', subjectName: 'English', weeklyPeriods: 5, type: 'subject' },
          { subjectId: 'Maths', subjectName: 'Maths', weeklyPeriods: 14, type: 'subject' },
          { subjectId: 'Science', subjectName: 'Science', weeklyPeriods: 14, type: 'subject' },
          { subjectId: 'PT', subjectName: 'PT', weeklyPeriods: 2, type: 'pt' }
        ]
      }
    };
    
    await ClassConfig.create(mockClassConfig);

    const teacherDuplicateCT = await User.create({
      uid: 'test_t4', email: 't4@testschool.com', name: 'Teacher 4', role: 'teacher', status: 'approved', isActive: true,
      assignedClasses: [
        { standard: testStandard, section: testSection, subject: 'Social', isClassTeacher: true, accessLevel: 'full' }
      ]
    });

    const mockTeachers1 = [teacher1, teacher2, teacher3, teacherDuplicateCT];

    // GENERATE TIMETABLE (Should Fail due to Duplicate Class Teacher)
    console.log("Testing duplicate Class Teacher...");
    let generator = new TimetableGenerator([mockClassConfig], mockTeachers1, 'TEST-YEAR');
    let result = await generator.run();
    if (result.success || !result.errors.some(e => e.includes('already has a Class Teacher'))) {
      throw new Error("Failed to detect duplicate Class Teacher");
    }
    console.log("PASS: Duplicate Class Teacher rejected.");

    // Remove duplicate
    await User.findByIdAndDelete(teacherDuplicateCT._id);
    const mockTeachers2 = [teacher1, teacher2, teacher3];

    // GENERATE TIMETABLE (Should succeed)
    console.log("Testing generation...");
    generator = new TimetableGenerator([mockClassConfig], mockTeachers2, 'TEST-YEAR');
    result = await generator.run();
    
    if (!result.success) {
      console.error(result.warnings);
      console.error(result.errors);
      throw new Error("Generation failed: " + JSON.stringify(result.errors));
    }
    console.log("PASS: Generation successful.");

    const drafts = result.schedule;
    await Timetable.insertMany(drafts);
    
    // Assert Tamil 1/day
    const tamilSlots = drafts.filter(d => d.subjectName === 'Tamil');
    const tamilDays = new Set(tamilSlots.map(d => d.day));
    if (tamilSlots.length !== 5 || tamilDays.size !== 5) throw new Error("Tamil not spread 1/day");
    
    // Assert English 1/day
    const englishSlots = drafts.filter(d => d.subjectName === 'English');
    const englishDays = new Set(englishSlots.map(d => d.day));
    if (englishSlots.length !== 5 || englishDays.size !== 5) throw new Error("English not spread 1/day");

    // Assert PT 2/week
    const ptSlots = drafts.filter(d => d.subjectName === 'PT');
    if (ptSlots.length !== 2) throw new Error(`PT count is ${ptSlots.length}, expected 2`);

    // Assert Class Teacher P1
    const t1IsClassTeacherP1 = tamilSlots.every(s => s.period === 1);
    if (!t1IsClassTeacherP1) throw new Error("Class teacher (Tamil) is not strictly Period 1");

    // Assert Teacher <= 6 per day
    const teacher1Daily = drafts.filter(d => d.teacherId === 'test_t1');
    const t1DayCounts = {};
    teacher1Daily.forEach(d => t1DayCounts[d.day] = (t1DayCounts[d.day] || 0) + 1);
    if (Object.values(t1DayCounts).some(c => c > 6)) throw new Error("Teacher > 6 periods a day");

    console.log("PASS: Constraints verified via generation.");

    // TEST MANUAL EDIT VALIDATION
    console.log("Testing manual edit validation...");
    
    await Timetable.insertMany([
      { academicYear: 'TEST-YEAR', day: 'Monday', period: 2, standard: 'TEST98', section: 'A', subjectId: 'X', subjectName: 'X', teacherId: 'test_t1', teacherName: 'T1', status: 'draft' },
      { academicYear: 'TEST-YEAR', day: 'Monday', period: 3, standard: 'TEST98', section: 'A', subjectId: 'X', subjectName: 'X', teacherId: 'test_t1', teacherName: 'T1', status: 'draft' },
      { academicYear: 'TEST-YEAR', day: 'Monday', period: 4, standard: 'TEST98', section: 'A', subjectId: 'X', subjectName: 'X', teacherId: 'test_t1', teacherName: 'T1', status: 'draft' },
      { academicYear: 'TEST-YEAR', day: 'Monday', period: 5, standard: 'TEST98', section: 'A', subjectId: 'X', subjectName: 'X', teacherId: 'test_t1', teacherName: 'T1', status: 'draft' },
      { academicYear: 'TEST-YEAR', day: 'Monday', period: 6, standard: 'TEST98', section: 'A', subjectId: 'X', subjectName: 'X', teacherId: 'test_t1', teacherName: 'T1', status: 'draft' },
      { academicYear: 'TEST-YEAR', day: 'Monday', period: 7, standard: 'TEST98', section: 'A', subjectId: 'X', subjectName: 'X', teacherId: 'test_t1', teacherName: 'T1', status: 'draft' }
    ]);

    mockRes = { statusCode: 200, status: function(code) { this.statusCode = code; return this; }, json: function(data) { this.data = data; return this; } };
    
    await validateChange({ 
      body: { academicYear: 'TEST-YEAR', day: 'Monday', period: 8, standard: 'TEST98', section: 'B', teacherId: 'test_t1', subjectName: 'NewSubj' } 
    }, mockRes);

    if (mockRes.statusCode !== 400 || !mockRes.data.message.includes('> 6 teaching periods')) {
      console.log("ACTUAL RESPONSE:", mockRes.statusCode, mockRes.data);
      throw new Error("Failed to block teacher overload in manual edit validation");
    }
    console.log("PASS: Manual edit teacher >6/day blocked.");
    
    // Try to double book Tamil
    mockRes = { statusCode: 200, status: function(code) { this.statusCode = code; return this; }, json: function(data) { this.data = data; return this; } };
    
    // Delete period 8 of TEST99-Z so it doesn't fail on Class Conflict
    await Timetable.deleteOne({ academicYear: 'TEST-YEAR', day: 'Monday', period: 8, standard: testStandard, section: testSection });

    await validateChange({ 
      body: { academicYear: 'TEST-YEAR', day: 'Monday', period: 8, standard: testStandard, section: testSection, teacherId: 'test_t3', subjectName: 'Tamil' } 
    }, mockRes);
    
    if (mockRes.statusCode !== 400 || !mockRes.data.message.includes('already scheduled')) {
      console.log("ACTUAL RESPONSE:", mockRes.statusCode, mockRes.data);
      throw new Error("Failed to block double Tamil daily rule");
    }
    console.log("PASS: Manual edit Tamil daily rule enforced.");

    console.log("=== ALL AUTOMATED TESTS PASSED ===");

  } catch (err) {
    console.error("TEST FAILED:", err);
    process.exit(1);
  } finally {
    // Cleanup
    await User.deleteMany({ email: /@testschool\.com/ });
    await ClassConfig.deleteMany({ standard: 'TEST99' });
    await Timetable.deleteMany({ academicYear: 'TEST-YEAR' });
    mongoose.connection.close();
  }
}

runTests();
