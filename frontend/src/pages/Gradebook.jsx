import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';

const subjects = ['Tamil', 'English', 'Math', 'Science', 'Social Science'];

export function Gradebook() {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState('All Terms');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const { dbUser } = useAuth();
  
  // Compute available standards and sections based on user role
  let availableStandards = [];
  let availableSections = [];

  if (dbUser?.role === 'admin') {
    availableStandards = ['6', '7', '8', '9', '10', '11', '12'];
    availableSections = ['A', 'B', 'C', 'D'];
  } else if (dbUser?.assignedClasses) {
    availableStandards = [...new Set(dbUser.assignedClasses.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
    availableSections = dbUser.assignedClasses
      .filter(c => c.standard === selectedClass)
      .map(c => c.section)
      .sort();
  }

  const isReportView = selectedClass === 'All' || selectedSection === 'All' || selectedTerm === 'All Terms';

  const hasFullAccess = !isReportView && (
    dbUser?.role === 'admin' || (
      dbUser?.assignedClasses?.find(c => c.standard === selectedClass && c.section === selectedSection)?.accessLevel !== 'view'
    )
  );

  React.useEffect(() => {
    if (availableStandards.length > 0 && !availableStandards.includes(selectedClass)) {
      setSelectedClass(availableStandards[0]);
    }
  }, [availableStandards, selectedClass]);

  React.useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(selectedSection)) {
      setSelectedSection(availableSections[0]);
    }
  }, [availableSections, selectedSection, selectedClass]);

  const [marks, setMarks] = useState({});

  const handleMarkChange = (studentId, subject, value) => {
    setMarks(prev => ({
      ...prev,
      [`${studentId}-${subject}`]: value
    }));
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await api.getStudents(selectedClass, selectedSection);
      setStudents(res.data || []);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    const newMarks = {};
    students.forEach(student => {
      let studentTotal = 0;
      
      subjects.forEach(sub => {
        let score = 0;
        
        if (selectedTerm === 'All Terms') {
          // Sum across all terms
          student.terms?.forEach(termData => {
            if (termData.marks) {
              const markObj = termData.marks.find(m => m.subject === sub);
              if (markObj !== undefined) {
                score += Number(markObj.score);
              }
            }
          });
        } else {
          // Single term
          const termData = student.terms?.find(t => t.termName === selectedTerm);
          if (termData && termData.marks) {
            const markObj = termData.marks.find(m => m.subject === sub);
            if (markObj !== undefined) {
              score = Number(markObj.score);
            }
          }
        }
        
        newMarks[`${student._id}-${sub}`] = score;
      });
    });
    setMarks(newMarks);
  }, [students, selectedTerm]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Group marks by student ID
      const studentUpdates = {};
      
      Object.entries(marks).forEach(([key, score]) => {
        const [studentId, subject] = key.split('-');
        if (!studentUpdates[studentId]) {
          studentUpdates[studentId] = [];
        }
        // Convert score to Number
        studentUpdates[studentId].push({ subject, score: Number(score) });
      });

      // Submit all updates
      const updatePromises = Object.entries(studentUpdates).map(([studentId, marksArray]) => {
        return api.updateMarks(studentId, selectedTerm, marksArray);
      });

      await Promise.all(updatePromises);
      alert(`${selectedTerm} marks saved successfully!`);
    } catch (err) {
      console.error('Failed to save marks', err);
      alert('Error saving marks.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow-sm dark:from-white dark:to-white/70">
        Term Gradebook
      </h1>

      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 space-y-2 w-full md:w-auto">
            <label className="block text-sm font-bold text-indigo-900/80 dark:text-white/80">Class</label>
            <select 
              value={selectedClass} 
              onChange={e => {
                setSelectedClass(e.target.value);
                if (e.target.value === 'All') setSelectedSection('All');
              }}
              className="glass-input w-full font-bold text-indigo-900 bg-white shadow-sm border border-indigo-100 focus:ring-indigo-400 disabled:opacity-50 dark:bg-[#0B0F19] dark:text-white dark:[&>option]:bg-[#0B0F19]"
            >
              <option value="All">All Standards</option>
              {availableStandards.map(std => (
                <option key={std} value={std}>Standard {std}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-2 w-full md:w-auto">
            <label className="block text-sm font-bold text-indigo-900/80 dark:text-white/80">Section</label>
            <select 
              value={selectedSection} 
              onChange={e => setSelectedSection(e.target.value)}
              className="glass-input w-full font-bold text-indigo-900 bg-white shadow-sm border border-indigo-100 focus:ring-indigo-400 disabled:opacity-50 dark:bg-[#0B0F19] dark:text-white dark:[&>option]:bg-[#0B0F19]"
              disabled={selectedClass === 'All'}
            >
              <option value="All">All Sections</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-2 w-full md:w-auto">
            <label className="block text-sm font-bold text-indigo-900/80 dark:text-white/80">Term</label>
            <select 
              value={selectedTerm} 
              onChange={e => setSelectedTerm(e.target.value)}
              className="glass-input w-full font-bold text-indigo-900 bg-white shadow-sm border border-indigo-100 focus:ring-indigo-400 disabled:opacity-50 dark:bg-[#0B0F19] dark:text-white dark:[&>option]:bg-[#0B0F19]"
            >
              <option value="All Terms">All Terms (Total Sum)</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
          <div className="flex-none w-full md:w-auto pt-2 md:pt-0">
            <NeonButton onClick={loadStudents} disabled={loadingStudents} className="w-full md:w-auto">
              {loadingStudents ? 'Loading...' : 'Load Students'}
            </NeonButton>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <form onSubmit={handleSave}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-indigo-50 text-indigo-900 dark:bg-white/5 dark:text-white">
                <tr className="border-b border-indigo-100 dark:border-white/10">
                  <th className="p-4 font-bold rounded-tl-lg whitespace-nowrap">Roll No</th>
                  <th className="p-4 font-bold whitespace-nowrap">Name</th>
                  {subjects.map(sub => (
                    <th key={sub} className="p-4 font-bold">{sub}</th>
                  ))}
                  <th className="p-4 font-black text-amber-500 rounded-tr-lg">Total</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student._id} className="border-b border-indigo-50 dark:border-white/5 hover:bg-indigo-50/30 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 text-indigo-900/70 dark:text-white/70 font-medium whitespace-nowrap">
                      {student.rollNumber}
                      {isReportView && <span className="ml-2 bg-indigo-100 text-indigo-700 dark:bg-white/10 dark:text-white/80 px-2 py-0.5 rounded-full text-xs font-bold inline-block whitespace-nowrap">Std {student.standard}-{student.section}</span>}
                    </td>
                    <td className="p-4 font-bold text-indigo-950 dark:text-white whitespace-nowrap">{student.name}</td>
                    {subjects.map(sub => (
                      <td key={sub} className="p-4">
                        <input 
                          type="number"
                          min="0"
                          max={selectedTerm === 'All Terms' ? "300" : "100"}
                          required
                          value={marks[`${student._id}-${sub}`] || (selectedTerm === 'All Terms' ? 0 : '')}
                          onChange={(e) => handleMarkChange(student._id, sub, e.target.value)}
                          className={`glass-input w-20 text-center font-bold text-indigo-900 bg-white shadow-sm ${!hasFullAccess ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-white/5 border-none shadow-none' : ''}`}
                          disabled={!hasFullAccess}
                        />
                      </td>
                    ))}
                    <td className="p-4 font-black text-amber-500 text-lg">
                      {subjects.reduce((sum, sub) => sum + (Number(marks[`${student._id}-${sub}`]) || 0), 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-end">
            {hasFullAccess ? (
              <NeonButton type="submit">Save {selectedTerm} Marks</NeonButton>
            ) : (
              <p className="text-slate-400 dark:text-slate-400 dark:text-white/50 text-sm italic">
                {isReportView ? 'Report views are read-only.' : 'You have view-only access to this class.'}
              </p>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
