import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { Trophy, Medal, Award, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useActivity } from '../context/ActivityContext';

export function Leaderboard() {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [rankBy, setRankBy] = useState('Marks');
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [classConfigs, setClassConfigs] = useState([]);
  const { setActivityContext, clearActivityContext } = useActivity();

  useEffect(() => {
    setActivityContext(selectedClass, selectedSection);
    return () => clearActivityContext();
  }, [selectedClass, selectedSection, setActivityContext, clearActivityContext]);

  const fetchStudentDetails = async (id) => {
    try {
      setSelectedStudentId(id);
      setLoadingDetails(true);
      const res = await api.getStudentById(id);
      setStudentDetails(res);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
      alert('Error fetching details.');
      setSelectedStudentId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.getLeaderboard(selectedClass, selectedSection, rankBy);
      setLeaderboard(res.data || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      alert('Error fetching leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const res = await api.getClassConfigs();
        setClassConfigs(Array.isArray(res) ? res : (res.data || []));
      } catch (err) {
        console.error('Failed to fetch configs', err);
      }
    };
    loadConfigs();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSection, rankBy]);

  const renderRankIcon = (rank) => {
    switch(rank) {
      case 1: return <span className="text-3xl sm:text-4xl drop-shadow-md" role="img" aria-label="Gold Trophy">🏆</span>;
      case 2: return <span className="text-3xl sm:text-4xl drop-shadow-md" role="img" aria-label="Silver Medal">🥈</span>;
      case 3: return <span className="text-3xl sm:text-4xl drop-shadow-md" role="img" aria-label="Bronze Medal">🥉</span>;
      default: return <div className="w-8 h-8 flex items-center justify-center font-bold text-xl text-[#4C677C]/60  ">{rank}</div>;
    }
  };

  const getTitle = () => {
    if (selectedClass === 'All') return 'Whole School Leaderboard';
    if (selectedSection === 'All') return `Standard ${selectedClass} Leaderboard`;
    return `Standard ${selectedClass} - Section ${selectedSection} Leaderboard`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-1 sm:px-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-3xl font-bold text-[#2E1C40] dark:text-gray-900 drop-shadow-sm whitespace-nowrap">
          {getTitle()}
        </h1>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0 justify-start lg:justify-end">
          <select 
            value={selectedClass} 
            onChange={e => {
              setSelectedClass(e.target.value);
              setSelectedSection('All');
            }}
            className="glass-input flex-1 sm:flex-none min-w-[140px] dark:!text-gray-900 dark:bg-transparent [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
          >
            <option value="All">All Standards</option>
            {[...new Set(classConfigs.map(c => c.standard))].sort((a,b) => Number(a) - Number(b)).map(std => (
              <option key={std} value={std}>Standard {std}</option>
            ))}
          </select>
          <select 
            value={selectedSection} 
            onChange={e => setSelectedSection(e.target.value)}
            className="glass-input flex-1 sm:flex-none min-w-[120px] dark:!text-gray-900 dark:bg-transparent [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
            disabled={selectedClass === 'All'}
          >
            <option value="All">All Sections</option>
            {classConfigs
              .filter(c => String(c.standard) === String(selectedClass))
              .map(c => c.section)
              .filter((v, i, a) => a.indexOf(v) === i) // unique
              .sort()
              .map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
          </select>
          <select 
            value={rankBy} 
            onChange={e => setRankBy(e.target.value)}
            className="glass-input flex-1 sm:flex-none min-w-[140px] dark:!text-gray-900 dark:bg-transparent [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
          >
            <option value="Marks">Rank by Marks</option>
            <option value="Percentage">Rank by Percentage</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        {loading ? (
          <div className="text-center py-10 text-[#4C677C] dark:text-gray-400">Calculating Ranks...</div>
        ) : (
          leaderboard.map((student, index) => {
            const isFirstOfRank = index === 0 || leaderboard[index - 1].rank !== student.rank;
            return (
              <div 
                key={`${student._id}-${rankBy}-${student.rank}`}
                onClick={() => fetchStudentDetails(student._id)}
                className={cn(
                  "glass-card p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 transition-all duration-300 hover:scale-[1.01] cursor-pointer rounded-2xl border shadow-sm",
                  student.rank === 1 ? "border-[#F6DEC6] bg-[#FFFBF0] dark:bg-[#FFFBF0]/10" : "",
                  student.rank === 2 ? "border-[#C6E7E7] bg-[#F0FCFC] dark:bg-[#F0FCFC]/10" : "",
                  student.rank === 3 ? "border-[#EBCBCA] bg-[#FFF6F5] dark:bg-[#FFF6F5]/10" : "",
                  student.rank > 3 ? "border-[#E5D9C4] bg-[#FAF8F5] dark:bg-[#121212]/60" : ""
                )}
              >
                <div className="flex flex-row items-center gap-3 sm:gap-6 flex-1 min-w-0">
                  {/* Left section: POS & RANK */}
                  <div className="flex flex-row items-center gap-2 sm:gap-5 shrink-0 pl-1 sm:pl-2">
                    <div className="flex flex-col items-center justify-center min-w-[25px] sm:min-w-[40px]">
                      {isFirstOfRank ? (
                        <>
                          <span className="text-[9px] sm:text-xs font-bold text-[#4C677C] uppercase tracking-wider mb-1">POS</span>
                          <span className="text-xl sm:text-4xl font-black text-[#2E1C40] dark:text-gray-100 leading-none">{student.rank}</span>
                        </>
                      ) : (
                        <span className="w-full h-full opacity-0 select-none flex flex-col items-center justify-center">
                          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider mb-1">POS</span>
                          <span className="text-xl sm:text-4xl font-black leading-none">{student.rank}</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Vertical divider */}
                    <div className={cn("w-px h-8 sm:h-14 bg-black/10 dark:bg-white/10", isFirstOfRank ? "opacity-100" : "opacity-0")}></div>
                    
                    <div className="flex flex-col items-center justify-center min-w-[35px] sm:min-w-[50px]">
                      <span className="text-[9px] sm:text-xs font-bold text-[#1E5D8F] uppercase tracking-wider mb-0.5 sm:mb-1">RANK</span>
                      <div className="mt-0.5 sm:mt-1 scale-75 sm:scale-100 origin-top">{renderRankIcon(student.rank)}</div>
                    </div>
                  </div>
                  
                  {/* Profile Image */}
                  <img 
                    src={student.photoUrl || 'https://placehold.co/150'} 
                    alt={student.name}
                    className="w-10 h-10 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-black/5 dark:border-white/10 shrink-0 bg-gray-200"
                  />
                  
                  {/* Name & Details */}
                  <div className="flex-1 min-w-0 py-0 sm:py-1">
                    <h3 className="text-sm sm:text-2xl font-bold truncate text-[#2E1C40] dark:text-gray-100">{student.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1.5">
                      <span className="text-[10px] sm:text-sm text-[#4C677C] dark:text-gray-400 font-medium">EMIS: {student.emisNumber}</span>
                      <span className="bg-[#EAE4DD] dark:bg-white/10 text-[#2E1C40] dark:text-gray-200 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-xs font-bold whitespace-nowrap">
                        Std {student.standard} - {student.section}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right section: MARKS & % */}
                <div className="flex flex-row items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-10 shrink-0 pt-2 sm:pt-0 mt-2 sm:mt-0 border-t sm:border-0 border-black/5 dark:border-white/5 pr-2 sm:pr-6">
                  <div className="flex flex-col items-start sm:items-end justify-center">
                    <span className="text-[9px] sm:text-xs font-bold text-[#4C677C] uppercase tracking-wider mb-0.5 sm:mb-1">MARKS</span>
                    <div className={`text-base sm:text-2xl font-black leading-none ${
                      student.rank === 1 ? 'text-[#AE634A]' : 
                      student.rank === 2 ? 'text-[#1E9AA7]' : 
                      student.rank === 3 ? 'text-[#793A36]' : 'text-[#2E1C40] dark:text-gray-100'
                    }`}>
                      {student.totalMarks} <span className="text-xs sm:text-xl opacity-70">/ {student.maximumMarks}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-center">
                    <span className="text-[9px] sm:text-xs font-bold text-[#4C677C] uppercase tracking-wider mb-0.5 sm:mb-1">%</span>
                    <div className="text-base sm:text-2xl font-black leading-none text-[#4C677C] dark:text-gray-300">
                      {student.percentage}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-auto">
            <GlassCard className="w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-white backdrop-blur-md py-4 border-b border-[#E5D9C4] dark:border-[#4C677C]/30 z-10 -mx-6 px-6 -mt-6">
                <h2 className="text-xl font-bold text-[#2E1C40] dark:text-gray-900">
                  Student Details
                </h2>
                <button 
                  onClick={() => { setSelectedStudentId(null); setStudentDetails(null); }} 
                  className="p-2 text-[#4C677C]/60 hover:text-[#2E1C40] dark:text-gray-400 dark:hover:text-gray-900 transition-colors rounded-full hover:bg-[#E5D9C4] dark:hover:bg-[#2E1C40]/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-10 text-[#4C677C] dark:text-gray-400">Loading details...</div>
              ) : studentDetails ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={studentDetails.photoUrl || 'https://placehold.co/150'} 
                      alt={studentDetails.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-white/20"
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-[#2E1C40] dark:text-gray-900">{studentDetails.name}</h3>
                      <div className="text-[#4C677C] dark:text-gray-300 font-medium">EMIS No: {studentDetails.emisNumber}</div>
                      <div className="text-[#4C677C] dark:text-gray-300 font-medium">Class: Std {studentDetails.standard} - {studentDetails.section}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-[#2E1C40] dark:text-gray-900 text-lg border-b border-[#E5D9C4] dark:border-[#4C677C]/30 pb-2">Academic Performance</h4>
                    {studentDetails.terms && studentDetails.terms.length > 0 ? (
                      studentDetails.terms.map(term => (
                        <div key={term.termName} className="bg-white/40 dark:bg-gray-900/10 p-4 rounded-xl border border-[#E5D9C4]/50 dark:border-[#4C677C]/30">
                          <h5 className="font-bold text-[#AE634A] dark:text-[#FA7848] mb-3">{term.termName}</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {term.marks && term.marks.map(mark => (
                              <div key={mark.subject} className="bg-white/60 dark:bg-[#121212]/60 p-2 rounded-lg border border-[#E5D9C4]/40 dark:border-[#4C677C]/20 text-center shadow-sm">
                                <div className="text-xs text-[#4C677C] dark:text-gray-400 mb-1">{mark.subject}</div>
                                <div className="font-bold text-[#2E1C40] dark:text-gray-900">{mark.score}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[#4C677C] dark:text-gray-400 italic">No marks recorded yet.</div>
                    )}
                  </div>
                </div>
              ) : null}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
