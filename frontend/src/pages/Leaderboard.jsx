import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { Trophy, Medal, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export function Leaderboard() {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
      const res = await api.getLeaderboard(selectedClass, selectedSection);
      setLeaderboard(res.data || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      alert('Error fetching leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Trophy className="w-8 h-8 text-[#AE634A] drop-shadow-sm" />;
      case 2: return <Medal className="w-8 h-8 text-[#62D4CA] drop-shadow-sm" />;
      case 3: return <Medal className="w-8 h-8 text-[#732A26] drop-shadow-sm" />;
      default: return <div className="w-8 h-8 flex items-center justify-center font-bold text-xl text-[#4C677C]/60  ">{rank}</div>;
    }
  };

  const getTitle = () => {
    if (selectedClass === 'All') return 'Whole School Leaderboard';
    if (selectedSection === 'All') return `Standard ${selectedClass} Leaderboard`;
    return `Standard ${selectedClass} - Section ${selectedSection} Leaderboard`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <h1 className="text-3xl font-bold text-[#2E1C40] dark:text-white drop-shadow-sm">
          {getTitle()}
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
          <select 
            value={selectedClass} 
            onChange={e => {
              setSelectedClass(e.target.value);
              if (e.target.value === 'All') {
                setSelectedSection('All');
              }
            }}
            className="glass-input w-full sm:w-auto dark:!text-white dark:bg-transparent [&>option]:bg-white dark:[&>option]:bg-[#131E3A] dark:[&>option]:text-white"
          >
            <option value="All">All Standards (Whole School)</option>
            <option value="6">Standard 6</option>
            <option value="7">Standard 7</option>
            <option value="8">Standard 8</option>
            <option value="9">Standard 9</option>
            <option value="10">Standard 10</option>
            <option value="11">Standard 11</option>
            <option value="12">Standard 12</option>
          </select>
          <select 
            value={selectedSection} 
            onChange={e => setSelectedSection(e.target.value)}
            className="glass-input w-full sm:w-auto dark:!text-white dark:bg-transparent [&>option]:bg-white dark:[&>option]:bg-[#131E3A] dark:[&>option]:text-white"
            disabled={selectedClass === 'All'}
          >
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
            <option value="A1">Section A1</option>
            <option value="A2">Section A2</option>
            <option value="B1">Section B1</option>
          </select>
          <NeonButton onClick={fetchLeaderboard} className="w-full sm:w-auto mt-2 sm:mt-0">Refresh</NeonButton>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        {loading ? (
          <div className="text-center py-10 text-[#4C677C] dark:text-gray-400">Calculating Ranks...</div>
        ) : (
          leaderboard.map((student) => (
            <div 
              key={student._id} 
              onClick={() => fetchStudentDetails(student._id)}
              className={cn(
                "glass-card p-4 flex flex-row items-center gap-3 sm:gap-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                student.rank === 1 ? "border-[#AE634A]/50 shadow-md bg-[#FDF9F7] dark:bg-[#AE634A]/10" : "",
                student.rank === 2 ? "border-[#62D4CA]/50 bg-[#F2FCFA] dark:bg-[#62D4CA]/10" : "",
                student.rank === 3 ? "border-[#732A26]/50 bg-[#FCF9F9] dark:bg-[#732A26]/10" : "",
                student.rank > 3 ? "border-[#E5D9C4] dark:border-[#4C677C]/30" : ""
              )}
            >
              <div className="w-10 sm:w-16 flex justify-center shrink-0">
                {renderRankIcon(student.rank)}
              </div>
              
              <img 
                src={student.photoUrl || 'https://via.placeholder.com/150'} 
                alt={student.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/20 shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold truncate text-[#2E1C40] dark:text-white">{student.name}</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#4C677C] dark:text-gray-300 text-xs sm:text-sm mt-1">
                  <span className="whitespace-nowrap">EMIS No: {student.emisNumber}</span>
                  {(selectedClass === 'All' || selectedSection === 'All') && (
                    <span className="bg-[#D8FDF6]/40 dark:bg-[#131E3A] text-[#2E1C40] dark:text-white px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap inline-block">
                      Std {student.standard} - {student.section}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <div className="text-xs sm:text-sm text-[#4C677C] dark:text-gray-300 mb-1 whitespace-nowrap">Total Marks</div>
                <div className={`text-xl sm:text-2xl font-black ${
                  student.rank === 1 ? 'text-[#AE634A]' : 
                  student.rank === 2 ? 'text-[#62D4CA]' : 
                  student.rank === 3 ? 'text-[#732A26]' : 'text-[#2E1C40] dark:text-white'
                }`}>
                  {student.totalMarks}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-auto">
            <GlassCard className="w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-[#0B132B] backdrop-blur-md py-4 border-b border-[#E5D9C4] dark:border-[#4C677C]/30 z-10 -mx-6 px-6 -mt-6">
                <h2 className="text-xl font-bold text-[#2E1C40] dark:text-white">
                  Student Details
                </h2>
                <button 
                  onClick={() => { setSelectedStudentId(null); setStudentDetails(null); }} 
                  className="p-2 text-[#4C677C]/60 hover:text-[#2E1C40] dark:text-gray-400 dark:hover:text-white transition-colors rounded-full hover:bg-[#E5D9C4] dark:hover:bg-[#2E1C40]/50"
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
                      src={studentDetails.photoUrl || 'https://via.placeholder.com/150'} 
                      alt={studentDetails.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-white/20"
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-[#2E1C40] dark:text-white">{studentDetails.name}</h3>
                      <div className="text-[#4C677C] dark:text-gray-300 font-medium">EMIS No: {studentDetails.emisNumber}</div>
                      <div className="text-[#4C677C] dark:text-gray-300 font-medium">Class: Std {studentDetails.standard} - {studentDetails.section}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-[#2E1C40] dark:text-white text-lg border-b border-[#E5D9C4] dark:border-[#4C677C]/30 pb-2">Academic Performance</h4>
                    {studentDetails.terms && studentDetails.terms.length > 0 ? (
                      studentDetails.terms.map(term => (
                        <div key={term.termName} className="bg-white/40 dark:bg-black/20 p-4 rounded-xl border border-[#E5D9C4]/50 dark:border-[#4C677C]/30">
                          <h5 className="font-bold text-[#AE634A] dark:text-[#FA7848] mb-3">{term.termName}</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {term.marks && term.marks.map(mark => (
                              <div key={mark.subject} className="bg-white/60 dark:bg-[#121212]/60 p-2 rounded-lg border border-[#E5D9C4]/40 dark:border-[#4C677C]/20 text-center shadow-sm">
                                <div className="text-xs text-[#4C677C] dark:text-gray-400 mb-1">{mark.subject}</div>
                                <div className="font-bold text-[#2E1C40] dark:text-white">{mark.score}</div>
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
