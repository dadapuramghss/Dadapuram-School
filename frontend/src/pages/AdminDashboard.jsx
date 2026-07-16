import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, GraduationCap, ShieldAlert, Activity, Trophy } from 'lucide-react';
import { StudentProfileModal } from '../components/ui/StudentProfileModal';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getDashboardStats();
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Admin Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-lg border border-gray-800 flex flex-col items-center justify-center text-center isolate bg-gradient-to-br from-blue-900/50 via-gray-900 to-slate-900">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl -z-10"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 rounded-full bg-purple-500/10 blur-2xl -z-10"></div>
        
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3 drop-shadow-md">
          DADAPURAM GOVERNMENT HR SEC SCHOOL
        </h1>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-gray-300 font-medium text-xs shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
          System Administration Dashboard
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-100">System Overview</h2>
        <p className="text-gray-400 mt-1">High-level metrics and system status.</p>
      </div>

      {loading ? (
        <div className="text-gray-500 py-10">Loading system metrics...</div>
      ) : (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 font-medium text-sm">Total Users</p>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-100">{stats?.totalTeachers || 0}</h3>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 font-medium text-sm">Total Students</p>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-100">{stats?.totalStudents || 0}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mt-8">
            {/* Top 3 Students (School-Wide) */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-gray-200">School Top 3 Students</h2>
              </div>
              
              {(!stats?.topStudents || stats.topStudents.length === 0) ? (
                <div className="text-gray-500 py-4 text-center">No student data available.</div>
              ) : (
                <div className="space-y-4">
                  {stats.topStudents.map((student, index) => (
                    <div 
                      key={student._id || index} 
                      onClick={() => setSelectedStudentId(student._id)}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 cursor-pointer hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          'bg-amber-700/20 text-amber-500'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-100">{student.name}</p>
                          <p className="text-xs text-gray-400">Class: {student.standard}-{student.section} | Roll: {student.rollNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-400">{student.totalMarks}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Marks</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {selectedStudentId && (
        <StudentProfileModal 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
        />
      )}
    </div>
  );
}
