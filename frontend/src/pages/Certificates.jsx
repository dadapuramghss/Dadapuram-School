import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { Printer, FileOutput } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { StudyCertificatePrint } from '../components/certificates/StudyCertificatePrint';

export function Certificates() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    language: 'TAMIL',
    standard: '',
    section: '',
    studentId: ''
  });

  const { dbUser } = useAuth();
  const printRef = useRef();

  let availableStandards = ['6', '7', '8', '9', '10', '11', '12'];
  let availableSections = ['A', 'B', 'C', 'D'];

  if (dbUser?.role !== 'admin' && dbUser?.assignedClasses?.length > 0) {
    availableStandards = [...new Set(dbUser.assignedClasses.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
    availableSections = dbUser.assignedClasses
      .filter(c => c.standard === filters.standard)
      .map(c => c.section)
      .sort();
  }

  useEffect(() => {
    const fetchStudents = async () => {
      if (!filters.standard || !filters.section) {
        setStudents([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await api.getStudents(filters.standard, filters.section);
        setStudents(response.data || []);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [filters.standard, filters.section]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      // Reset dependent fields when parent changes
      ...(name === 'standard' && { section: '', studentId: '' }),
      ...(name === 'section' && { studentId: '' })
    }));

    if (name === 'studentId') {
      const student = students.find(s => s._id === value);
      setSelectedStudent(student || null);
    } else if (name === 'standard' || name === 'section') {
      setSelectedStudent(null);
    }
  };

  const handlePrint = () => {
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow-sm dark:from-white dark:to-white/70">
            Study Certificate App
          </h1>
          <p className="text-slate-500 dark:text-slate-500 dark:text-white/60 mt-1">Select details to generate certificate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        <GlassCard className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-800 dark:text-slate-800 dark:text-white">
              <tbody>
                <tr className="border-b border-indigo-50 dark:border-white/10">
                  <th className="py-3 font-bold text-indigo-900/80 dark:text-white/80 w-1/3">Language</th>
                  <td className="py-3">
                    <select
                      name="language"
                      value={filters.language}
                      onChange={handleFilterChange}
                      className="glass-input w-full font-bold text-indigo-900 bg-white shadow-sm border border-indigo-100 focus:ring-indigo-400 disabled:opacity-50 dark:bg-[#0B0F19]"
                    >
                      <option value="TAMIL">tamil</option>
                      <option value="ENGLISH">english</option>
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-indigo-50 dark:border-white/10">
                  <th className="py-3 font-bold text-indigo-900/80 dark:text-white/80">Class</th>
                  <td className="py-3">
                    <select
                      name="standard"
                      value={filters.standard}
                      onChange={handleFilterChange}
                      className="glass-input w-full font-bold text-indigo-900 bg-white shadow-sm border border-indigo-100 focus:ring-indigo-400 disabled:opacity-50 dark:bg-[#0B0F19]"
                    >
                      <option value="">Select Class</option>
                      {availableStandards.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-indigo-50 dark:border-white/10">
                  <th className="py-3 font-bold text-indigo-900/80 dark:text-white/80">Section</th>
                  <td className="py-3">
                    <select
                      name="section"
                      value={filters.section}
                      onChange={handleFilterChange}
                      disabled={!filters.standard}
                      className="glass-input w-full font-bold text-indigo-900 bg-white shadow-sm border border-indigo-100 focus:ring-indigo-400 disabled:opacity-50 dark:bg-[#0B0F19]"
                    >
                      <option value="">Select Section</option>
                      {availableSections.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-indigo-50 dark:border-white/10">
                  <th className="py-3 font-bold text-indigo-900/80 dark:text-white/80">Student Name</th>
                  <td className="py-3">
                    <select
                      name="studentId"
                      value={filters.studentId}
                      onChange={handleFilterChange}
                      disabled={!filters.section}
                      className="glass-input w-full font-bold text-indigo-900 bg-white shadow-sm border border-indigo-100 focus:ring-indigo-400 disabled:opacity-50 dark:bg-[#0B0F19]"
                    >
                      <option value="">Select Student</option>
                      {students.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <th className="py-3 font-bold text-indigo-900/80 dark:text-white/80">EMIS Number</th>
                  <td className="py-3">
                    <div className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 text-indigo-900 font-bold dark:bg-white/5 dark:border-white/10 dark:text-white/70">
                      {selectedStudent ? selectedStudent.rollNumber : '-'}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="flex flex-col gap-4 justify-center items-center">
          <NeonButton 
            onClick={handlePrint}
            disabled={!selectedStudent}
            className="w-full py-4 text-lg flex items-center justify-center gap-2"
          >
            <Printer className="w-6 h-6" />
            PRINT PREVIEW
          </NeonButton>
        </div>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-xl font-bold mb-4 bg-indigo-50 text-indigo-900 p-3 rounded-xl dark:bg-white/5 dark:text-white">Student Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-800 dark:text-slate-800 dark:text-white">
            <tbody>
              <tr className="border-b border-indigo-50 dark:border-white/10">
                <th className="py-3 font-bold text-indigo-900/80 dark:text-white/80 w-1/4">DOB:</th>
                <td className="py-3 font-bold text-indigo-950 dark:text-white">{selectedStudent?.dob || '-'}</td>
              </tr>
              <tr className="border-b border-indigo-50 dark:border-white/10">
                <th className="py-3 font-bold text-indigo-900/80 dark:text-white/80">Father's Name:</th>
                <td className="py-3 font-bold text-indigo-950 dark:text-white">{selectedStudent?.fatherName || '-'}</td>
              </tr>
              <tr>
                <th className="py-3 font-bold text-indigo-900/80 dark:text-white/80">Address:</th>
                <td className="py-3 font-bold text-indigo-950 dark:text-white">{selectedStudent?.address || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Hidden Print Component */}
      <StudyCertificatePrint ref={printRef} student={selectedStudent} />

    </div>
  );
}
