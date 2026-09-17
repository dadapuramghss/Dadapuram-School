import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { api } from '../lib/api';
import { Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function StudentTimetable() {
  const { dbUser } = useAuth(); // Assuming dbUser has standard and section for student
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dbUser?.standard && dbUser?.section) {
      fetchTimetable();
    }
  }, [academicYear, dbUser]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.getTimetable({ 
        academicYear, 
        standard: dbUser.standard,
        section: dbUser.section,
        status: 'published' // Only show published timetable
      });
      setTimetable(res || []);
    } catch (err) {
      console.error('Failed to fetch student timetable', err);
    } finally {
      setLoading(false);
    }
  };

  const getCellData = (day, period) => {
    return timetable.find(t => t.day === day && t.period === period);
  };

  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-7 h-7 mr-3 text-studentAccent" />
            Class Timetable
          </h1>
          <p className="text-gray-500 mt-1">Schedule for {dbUser?.standard}-{dbUser?.section}</p>
        </div>
        <select 
          value={academicYear} 
          onChange={e => setAcademicYear(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
        >
          <option value="2025-26">2025-26</option>
          <option value="2026-27">2026-27</option>
        </select>
      </div>

      <GlassCard className="p-0 overflow-hidden relative min-h-[300px]">
        {loading && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">Loading timetable...</div>}
        
        {timetable.length === 0 && !loading ? (
          <div className="p-12 text-center text-gray-500">
            No published timetable found for your class yet.
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-center border-collapse border border-gray-200 rounded-lg">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="p-3 border-b border-r font-medium border-gray-200">Day / Period</th>
                  {periods.map(p => (
                    <th key={p} className="p-3 border-b border-r font-medium border-gray-200">P{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEFAULT_WORKING_DAYS.map(day => (
                  <tr key={day} className="border-b border-gray-200 hover:bg-gray-50/50">
                    <td className="p-3 border-r font-medium text-gray-800 bg-gray-50/30">{day}</td>
                    {periods.map(p => {
                      const cellData = getCellData(day, p);
                      
                      return (
                        <td key={p} className="p-2 border-r border-gray-200">
                          {cellData ? (
                            <div className="flex flex-col text-sm justify-center">
                              <span className="font-semibold text-gray-900">{cellData.subjectName}</span>
                              <span className="text-gray-500 text-xs mt-1">{cellData.teacherName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
