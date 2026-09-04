import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, GraduationCap, ShieldAlert, Activity, Trophy, Medal } from 'lucide-react';
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
      <div className="relative p-6 md:p-8 bg-white rounded-[24px] overflow-hidden border border-gray-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_30px_-10px_rgba(11,19,43,0.5)] flex flex-col items-center text-center">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-adminAccent2 text-white/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-32 w-64 h-64 bg-adminSidebar text-white/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-gray-50 border border-gray-200 text-gray-500 font-medium text-[10px] tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-adminAccent2 text-white animate-pulse"></span>
          System Administration
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">
          Dadapuram Government HR Sec School
        </h1>
      </div>

      <div className="mt-6 mb-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">System Overview</h2>
        <p className="text-gray-500 mt-1 text-sm font-medium">High-level metrics and system status.</p>
      </div>

      {loading ? (
        <div className="text-gray-500 py-10">Loading system metrics...</div>
      ) : (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white shadow-sm border border-gray-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between hover:bg-gray-50 hover:shadow-md transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-widest">Total Users</p>
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-200">
                  <Users className="w-4 h-4 text-adminAccent2" />
                </div>
              </div>
              <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{stats?.totalTeachers || 0}</h3>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between hover:bg-gray-50 hover:shadow-md transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-widest">Total Students</p>
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-200">
                  <GraduationCap className="w-4 h-4 text-adminSidebar" />
                </div>
              </div>
              <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{stats?.totalStudents || 0}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            {/* Top 3 Students (School-Wide) */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-adminAccent2 text-white/10 rounded-lg">
                  <Trophy className="w-4 h-4 text-adminAccent2" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">School Top 3</h2>
              </div>
              
              {(!stats?.topStudents || stats.topStudents.length === 0) ? (
                <div className="text-gray-500 py-6 text-center font-medium">No student data available.</div>
              ) : (
                <div className="space-y-3">
                  {stats.topStudents.map((student, index) => (
                    <div 
                      key={student._id || index} 
                      onClick={() => setSelectedStudentId(student._id)}
                      className="flex items-center justify-between p-3 bg-white shadow-sm rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-adminAccent2 text-white shadow-md shadow-adminAccent2/20' :
                          index === 1 ? 'bg-adminAccent2/80 text-white shadow-md shadow-[#EBD8BE]/20' :
                          'bg-adminSidebar text-white shadow-md shadow-[#5D7D9A]/20'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base tracking-tight">{student.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Class: {student.standard}-{student.section}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end justify-center">
                        <span className="text-[10px] font-bold text-gray-400 mb-0.5 tracking-wide">{student.totalMarks} / {student.maximumMarks}</span>
                        <p className="text-xl font-extrabold text-adminAccent2 leading-none">{student.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 3 Students (12th Standard) */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-indigo-500 text-white/10 rounded-lg">
                  <Trophy className="w-4 h-4 text-indigo-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">12th Top 3</h2>
              </div>
              
              {(!stats?.top12Students || stats.top12Students.length === 0) ? (
                <div className="text-gray-500 py-6 text-center font-medium">No student data available.</div>
              ) : (
                <div className="space-y-3">
                  {stats.top12Students.map((student, index) => (
                    <div 
                      key={student._id || index} 
                      onClick={() => setSelectedStudentId(student._id)}
                      className="flex items-center justify-between p-3 bg-white shadow-sm rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' :
                          index === 1 ? 'bg-indigo-400 text-white shadow-md shadow-indigo-400/20' :
                          'bg-indigo-300 text-white shadow-md shadow-indigo-300/20'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base tracking-tight">{student.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Class: {student.standard}-{student.section}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end justify-center">
                        <span className="text-[10px] font-bold text-gray-400 mb-0.5 tracking-wide">{student.totalMarks} / {student.maximumMarks}</span>
                        <p className="text-xl font-extrabold text-indigo-500 leading-none">{student.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 3 Students (10th Standard) */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-[#FA7848] text-white/10 rounded-lg">
                  <Trophy className="w-4 h-4 text-[#FA7848]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">10th Top 3</h2>
              </div>
              
              {(!stats?.top10Students || stats.top10Students.length === 0) ? (
                <div className="text-gray-500 py-6 text-center font-medium">No student data available.</div>
              ) : (
                <div className="space-y-3">
                  {stats.top10Students.map((student, index) => (
                    <div 
                      key={student._id || index} 
                      onClick={() => setSelectedStudentId(student._id)}
                      className="flex items-center justify-between p-3 bg-white shadow-sm rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-[#FA7848] text-white shadow-md shadow-[#FA7848]/20' :
                          index === 1 ? 'bg-[#FA8858] text-white shadow-md shadow-[#FA8858]/20' :
                          'bg-[#FA9868] text-white shadow-md shadow-[#FA9868]/20'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base tracking-tight">{student.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Class: {student.standard}-{student.section}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end justify-center">
                        <span className="text-[10px] font-bold text-gray-400 mb-0.5 tracking-wide">{student.totalMarks} / {student.maximumMarks}</span>
                        <p className="text-xl font-extrabold text-[#FA7848] leading-none">{student.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            {/* Students Abstract */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-adminSidebar text-white/10 rounded-lg">
                  <Activity className="w-4 h-4 text-adminSidebar" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Students Abstract</h2>
              </div>
              
              {(!stats?.studentsAbstract || stats.studentsAbstract.length === 0) ? (
                <div className="text-gray-500 py-6 text-center font-medium">No abstract data available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Class</th>
                        <th className="px-4 py-3 text-center">Boys</th>
                        <th className="px-4 py-3 text-center">Girls</th>
                        <th className="px-4 py-3 text-center rounded-r-lg">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.studentsAbstract.map((abs, idx) => (
                        <tr key={idx} className="border-b border-gray-200 last:border-0 hover:bg-white shadow-sm transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{abs._id.standard} - {abs._id.section}</td>
                          <td className="px-4 py-3 text-center text-adminSidebar font-semibold">{abs.maleStudents}</td>
                          <td className="px-4 py-3 text-center text-[#FA7848] font-semibold">{abs.femaleStudents}</td>
                          <td className="px-4 py-3 text-center font-bold text-adminAccent2">{abs.totalStudents}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            {/* Classwise First Marks */}
            <div className="bg-white shadow-sm border border-gray-200 shadow-sm rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-[#FA7848]/10 rounded-lg">
                  <Medal className="w-4 h-4 text-[#FA7848]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Classwise First Marks</h2>
              </div>
              
              {(!stats?.classwiseFirstMarks || stats.classwiseFirstMarks.length === 0) ? (
                <div className="text-gray-500 py-6 text-center font-medium">No exam data available.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.classwiseFirstMarks.map((fm, idx) => (
                    <div key={idx} className="p-4 bg-white shadow-sm rounded-xl border border-gray-200 hover:bg-white/[0.05] transition-colors flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-adminSidebar bg-adminSidebar text-white/10 px-2 py-1 rounded-md">
                          {fm._id.standard} - {fm._id.section}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                          {fm._id.termName}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 truncate">{fm.topStudent}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Trophy className="w-3.5 h-3.5 text-adminAccent2" />
                          <span className="text-sm font-semibold text-adminAccent2">{fm.topScore} marks</span>
                        </div>
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
