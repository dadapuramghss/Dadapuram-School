import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, GraduationCap, Award } from 'lucide-react';
import { StudentProfileModal } from '../components/ui/StudentProfileModal';

export function Dashboard() {
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
    <div className="space-y-6 pb-10">
      {/* Premium Vibrant Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-md border-0 flex flex-col items-center justify-center text-center isolate bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 rounded-full bg-white/10 blur-2xl -z-10"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 rounded-full bg-white/10 blur-2xl -z-10"></div>
        
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3 drop-shadow-md">
          DADAPURAM GOVERNMENT HR SEC SCHOOL
        </h1>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium text-xs shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          Analytics & Performance Dashboard
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10 font-medium">Loading statistics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.06)] border-t-4 border-indigo-500 flex items-center gap-4 hover:shadow-[0_4px_20px_rgb(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-3.5 bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 rounded-xl shrink-0 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Total Students</p>
                <h3 className="text-3xl font-black text-slate-800">{stats?.totalStudents || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.06)] border-t-4 border-sky-500 flex items-center gap-4 hover:shadow-[0_4px_20px_rgb(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-3.5 bg-gradient-to-br from-sky-100 to-sky-50 text-sky-600 rounded-xl shrink-0 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Male Students</p>
                <h3 className="text-3xl font-black text-slate-800">{stats?.maleStudents || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.06)] border-t-4 border-pink-500 flex items-center gap-4 hover:shadow-[0_4px_20px_rgb(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-3.5 bg-gradient-to-br from-pink-100 to-pink-50 text-pink-600 rounded-xl shrink-0 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Female Students</p>
                <h3 className="text-3xl font-black text-slate-800">{stats?.femaleStudents || 0}</h3>
              </div>
            </div>
          </div>

          {/* Top 3 Rankers */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-yellow-50 text-yellow-500 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Top 3 School Rankers</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {stats?.topStudents?.map((student, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;
                
                return (
                  <div 
                    key={student._id} 
                    onClick={() => setSelectedStudentId(student._id)}
                    className={`relative flex flex-col items-center p-6 rounded-[1.5rem] border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    isFirst ? 'bg-gradient-to-b from-yellow-50 to-white border-yellow-100 shadow-[0_4px_20px_rgba(234,179,8,0.1)]' : 
                    isSecond ? 'bg-gradient-to-b from-slate-50 to-white border-slate-200' : 
                    'bg-gradient-to-b from-orange-50 to-white border-orange-100'
                  }`}>
                    {/* Rank Badge */}
                    <div className={`absolute -top-4 w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg shadow-md border-2 border-white ${
                      isFirst ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white' : 
                      isSecond ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' : 
                      'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mt-3 shadow-inner ${
                      isFirst ? 'bg-yellow-100 text-yellow-600' : 
                      isSecond ? 'bg-slate-200 text-slate-600' : 
                      'bg-orange-100 text-orange-600'
                    }`}>
                      <span className="text-2xl font-black">{student.name.charAt(0)}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 text-center mb-0.5">{student.name}</h3>
                    <p className="text-slate-500 text-sm font-medium mb-4">Class {student.standard}-{student.section}</p>
                    
                    <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex flex-col items-center w-full">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Total Score</span>
                      <span className={`text-2xl font-black ${
                        isFirst ? 'text-yellow-500' : isSecond ? 'text-slate-600' : 'text-orange-500'
                      }`}>
                        {student.totalMarks}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {(!stats?.topStudents || stats.topStudents.length === 0) && (
                <div className="col-span-3 text-center py-10 text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  No student scores available yet.
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
