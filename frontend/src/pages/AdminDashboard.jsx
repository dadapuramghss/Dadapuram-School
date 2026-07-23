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
      <div className="relative p-6 md:p-8 bg-[#18263B] rounded-[24px] overflow-hidden border border-[#5D7D9A]/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_30px_-10px_rgba(11,19,43,0.5)] flex flex-col items-center text-center">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F9CB84]/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-32 w-64 h-64 bg-[#5D7D9A]/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-white/5 border border-white/5 text-white/80 font-medium text-[10px] tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F9CB84] animate-pulse"></span>
          System Administration
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
          Dadapuram Government HR Sec School
        </h1>
      </div>

      <div className="mt-6 mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">System Overview</h2>
        <p className="text-[#EBD8BE]/50 mt-1 text-sm font-medium">High-level metrics and system status.</p>
      </div>

      {loading ? (
        <div className="text-[#EBD8BE]/50 py-10">Loading system metrics...</div>
      ) : (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/5 shadow-sm rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/50 font-semibold text-[10px] uppercase tracking-widest">Total Users</p>
                <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                  <Users className="w-4 h-4 text-[#F9CB84]" />
                </div>
              </div>
              <h3 className="text-4xl font-extrabold text-white tracking-tight">{stats?.totalTeachers || 0}</h3>
            </div>

            <div className="bg-white/[0.02] border border-white/5 shadow-sm rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/50 font-semibold text-[10px] uppercase tracking-widest">Total Students</p>
                <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                  <GraduationCap className="w-4 h-4 text-[#5D7D9A]" />
                </div>
              </div>
              <h3 className="text-4xl font-extrabold text-white tracking-tight">{stats?.totalStudents || 0}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            {/* Top 3 Students (School-Wide) */}
            <div className="bg-white/[0.02] border border-white/5 shadow-sm rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-[#F9CB84]/10 rounded-lg">
                  <Trophy className="w-4 h-4 text-[#F9CB84]" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">School Top 3 Students</h2>
              </div>
              
              {(!stats?.topStudents || stats.topStudents.length === 0) ? (
                <div className="text-white/40 py-6 text-center font-medium">No student data available.</div>
              ) : (
                <div className="space-y-3">
                  {stats.topStudents.map((student, index) => (
                    <div 
                      key={student._id || index} 
                      onClick={() => setSelectedStudentId(student._id)}
                      className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5 cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-[#F9CB84] text-[#131E3A] shadow-md shadow-[#F9CB84]/20' :
                          index === 1 ? 'bg-[#EBD8BE] text-[#131E3A] shadow-md shadow-[#EBD8BE]/20' :
                          'bg-[#5D7D9A] text-white shadow-md shadow-[#5D7D9A]/20'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-white text-base tracking-tight">{student.name}</p>
                          <p className="text-[10px] text-white/50 font-medium mt-0.5">Class: {student.standard}-{student.section} <span className="mx-1.5 opacity-50">•</span> EMIS: {student.emisNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-[#F9CB84]">{student.totalMarks}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">Total Marks</p>
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
