import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { api } from '../lib/api';
import { Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TeacherTimetable() {
  const { user } = useAuth();
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchTimetable();
    }
  }, [academicYear, user]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.getTimetable({ 
        academicYear, 
        teacherId: user.uid,
        status: 'published' // Only show published timetable
      });
      setTimetable(res || []);
    } catch (err) {
      console.error('Failed to fetch teacher timetable', err);
    } finally {
      setLoading(false);
    }
  };

  const getCellData = (day, period) => {
    return timetable.find(t => t.day === day && t.period === period);
  };

  const periods = [1, 2, 3, 4, 5, 6, 7, 8];
  
  // Calculate stats
  let totalTeaching = timetable.length;
  let totalFree = (DEFAULT_WORKING_DAYS.length * periods.length) - totalTeaching;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-7 h-7 mr-3 text-adminAccent2" />
            My Timetable
          </h1>
          <p className="text-gray-500 mt-1">View your teaching schedule</p>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Teaching Periods</p>
          <p className="text-2xl font-bold text-gray-900">{totalTeaching}</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Free Periods</p>
          <p className="text-2xl font-bold text-green-600">{totalFree}</p>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden relative min-h-[300px]">
        {loading && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">Loading timetable...</div>}
        
        {timetable.length === 0 && !loading ? (
          <div className="p-12 text-center text-gray-500">
            No published timetable found for you in this academic year.
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
                {DEFAULT_WORKING_DAYS.map(day => {
                  let dailyTeaching = 0;
                  return (
                    <tr key={day} className="border-b border-gray-200 hover:bg-gray-50/50">
                      <td className="p-3 border-r font-medium text-gray-800 bg-gray-50/30">{day}</td>
                      {periods.map(p => {
                        const cellData = getCellData(day, p);
                        if (cellData) dailyTeaching++;
                        
                        return (
                          <td key={p} className={`p-2 border-r border-gray-200 ${cellData ? 'bg-blue-50/30' : 'bg-green-50/30'}`}>
                            {cellData ? (
                              <div className="flex flex-col text-sm justify-center">
                                <span className="font-semibold text-blue-900">{cellData.standard}-{cellData.section}</span>
                                <span className="text-blue-700 text-xs mt-1">{cellData.subjectName}</span>
                              </div>
                            ) : (
                              <span className="text-green-600 font-medium text-xs">FREE</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
