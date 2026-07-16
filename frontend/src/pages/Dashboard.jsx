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
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-lg flex flex-col items-start justify-center isolate bg-[#2E1C40]">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#732A26]/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-32 w-64 h-64 bg-[#4C677C]/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/2 right-16 w-32 h-32 bg-[#62D4CA]/20 rounded-full blur-2xl -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-[#D8FDF6]/10 border border-[#D8FDF6]/20 text-[#D8FDF6] font-medium text-[10px] tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#62D4CA] animate-pulse"></span>
          Teacher Dashboard
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#E5D9C4] tracking-tight drop-shadow-sm">
          Dadapuram Government HR Sec School
        </h1>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10 font-medium">Loading statistics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#D8FDF6] flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-3 bg-[#62D4CA]/15 text-[#62D4CA] rounded-xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[#4C677C] text-[10px] font-bold uppercase tracking-widest mb-0.5">Total Students</p>
                <h3 className="text-3xl font-extrabold text-[#2E1C40] tracking-tight">{stats?.totalStudents || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5D9C4] flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-3 bg-[#586F54]/15 text-[#586F54] rounded-xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[#586F54]/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">Male Students</p>
                <h3 className="text-3xl font-extrabold text-[#586F54] tracking-tight">{stats?.maleStudents || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5D9C4] flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="p-3 bg-[#AE634A]/15 text-[#AE634A] rounded-xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[#AE634A]/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">Female Students</p>
                <h3 className="text-3xl font-extrabold text-[#AE634A] tracking-tight">{stats?.femaleStudents || 0}</h3>
              </div>
            </div>
          </div>

          {/* Top 3 Rankers */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D8FDF6]/80 mt-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 bg-[#4C677C]/10 text-[#4C677C] rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-[#2E1C40] tracking-tight">Top 3 School Rankers</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats?.topStudents?.map((student, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                
                return (
                  <div 
                    key={student._id} 
                    onClick={() => setSelectedStudentId(student._id)}
                    className={`relative flex flex-col items-center p-6 rounded-3xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    isFirst ? 'bg-[#FDF9F7] border-[#AE634A]/20' : 
                    isSecond ? 'bg-[#F2FCFA] border-[#62D4CA]/30' : 
                    'bg-[#FCF9F9] border-[#732A26]/20'
                  }`}>
                    {/* Rank Badge */}
                    <div className={`absolute -top-4 w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg shadow-md border-2 border-white ${
                      isFirst ? 'bg-[#AE634A] text-[#E5D9C4]' : 
                      isSecond ? 'bg-[#62D4CA] text-[#2E1C40]' : 
                      'bg-[#732A26] text-[#E5D9C4]'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mt-3 ${
                      isFirst ? 'bg-[#AE634A]/10 text-[#AE634A]' : 
                      isSecond ? 'bg-[#62D4CA]/15 text-[#62D4CA]' : 
                      'bg-[#732A26]/10 text-[#732A26]'
                    }`}>
                      <span className="text-2xl font-black">{student.name.charAt(0)}</span>
                    </div>

                    <h3 className={`text-lg font-bold text-center mb-0.5 ${
                      isFirst ? 'text-[#AE634A]' : isSecond ? 'text-[#4C677C]' : 'text-[#732A26]'
                    }`}>{student.name}</h3>
                    <p className={`font-medium text-sm mb-5 ${
                      isFirst ? 'text-[#AE634A]/60' : isSecond ? 'text-[#4C677C]/60' : 'text-[#732A26]/60'
                    }`}>Class {student.standard}-{student.section}</p>
                    
                    <div className="bg-white px-4 py-3 rounded-xl border border-white flex flex-col items-center w-full shadow-sm">
                      <span className={`text-[9px] uppercase tracking-widest font-bold mb-0.5 ${
                        isFirst ? 'text-[#AE634A]/70' : isSecond ? 'text-[#4C677C]/70' : 'text-[#732A26]/70'
                      }`}>Total Score</span>
                      <span className={`text-2xl font-black ${
                        isFirst ? 'text-[#AE634A]' : isSecond ? 'text-[#62D4CA]' : 'text-[#732A26]'
                      }`}>
                        {student.totalMarks}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {(!stats?.topStudents || stats.topStudents.length === 0) && (
                <div className="col-span-3 text-center py-10 text-[#4C677C]/60 font-medium bg-[#F4F8F7] rounded-2xl border border-[#D8FDF6] border-dashed">
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
