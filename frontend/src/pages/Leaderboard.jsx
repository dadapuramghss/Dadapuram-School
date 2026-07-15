import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { Trophy, Medal } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export function Leaderboard() {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

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
      case 1: return <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />;
      case 2: return <Medal className="w-8 h-8 text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.8)]" />;
      case 3: return <Medal className="w-8 h-8 text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.8)]" />;
      default: return <div className="w-8 h-8 flex items-center justify-center font-bold text-xl text-slate-400 dark:text-slate-400 dark:text-white/50">{rank}</div>;
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
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-sm">
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
            className="glass-input w-full sm:w-auto dark:!text-white [&>option]:bg-white dark:[&>option]:bg-gray-800 dark:bg-gray-800/50"
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
            className="glass-input w-full sm:w-auto dark:!text-white [&>option]:bg-white dark:[&>option]:bg-gray-800 dark:bg-gray-800/50"
            disabled={selectedClass === 'All'}
          >
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>
          <NeonButton onClick={fetchLeaderboard} className="w-full sm:w-auto mt-2 sm:mt-0">Refresh</NeonButton>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        {loading ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-500 dark:text-white/60">Calculating Ranks...</div>
        ) : (
          leaderboard.map((student) => (
            <div 
              key={student._id} 
              className={cn(
                "glass-card p-4 flex flex-row items-center gap-3 sm:gap-6 transition-all duration-300 hover:scale-[1.02]",
                student.rank === 1 ? "border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.2)] bg-yellow-400/5" : "",
                student.rank === 2 ? "border-gray-300/50 bg-gray-300/5" : "",
                student.rank === 3 ? "border-amber-600/50 bg-amber-600/5" : ""
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
                <h3 className="text-xl font-bold truncate">{student.name}</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-500 dark:text-slate-500 dark:text-white/60 text-xs sm:text-sm mt-1">
                  <span className="whitespace-nowrap">Roll No: {student.rollNumber}</span>
                  {(selectedClass === 'All' || selectedSection === 'All') && (
                    <span className="bg-indigo-50 text-indigo-700 dark:bg-white/10 dark:text-white/80 px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap inline-block">
                      Std {student.standard} - {student.section}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 dark:text-white/60 mb-1 whitespace-nowrap">Total Marks</div>
                <div className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primaryGlow to-secondaryGlow">
                  {student.totalMarks}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
