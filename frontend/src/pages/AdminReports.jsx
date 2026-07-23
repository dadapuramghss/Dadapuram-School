import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { PieChart, FileText } from 'lucide-react';

export function AdminReports() {
  const [allStudents, setAllStudents] = useState([]);
  const [demographicFilter, setDemographicFilter] = useState('community');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.getStudents('All', 'All');
        setAllStudents(response.data || []);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const renderDemographics = () => {
    if (loading) return <div className="text-white/40 text-center py-10 font-medium">Loading report data...</div>;
    if (!allStudents.length) return <div className="text-white/40 text-center py-10 font-medium">No student data available for reports.</div>;
    
    let grouped = {};
    if (demographicFilter === 'community') {
      grouped = allStudents.reduce((acc, curr) => {
        const key = curr.community ? curr.community.toUpperCase() : 'UNKNOWN';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    } else if (demographicFilter === 'class') {
      grouped = allStudents.reduce((acc, curr) => {
        const key = `Standard ${curr.standard || 'Unknown'}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    } else if (demographicFilter === 'section') {
      grouped = allStudents.reduce((acc, curr) => {
        const key = `Section ${curr.section || 'Unknown'}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    } else if (demographicFilter === 'gender') {
      grouped = allStudents.reduce((acc, curr) => {
        const key = curr.gender || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    }

    // Sort entries to display nicely (e.g. alphabetical)
    const sortedEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
        {sortedEntries.map(([key, count]) => (
          <div key={key} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <span className="text-[#EBD8BE]/70 text-xs font-bold uppercase tracking-widest mb-3 text-center">{key}</span>
            <span className="text-4xl font-black text-white drop-shadow-sm">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#EBD8BE] drop-shadow-sm flex items-center gap-3">
            <div className="p-2 bg-[#EBD8BE]/10 rounded-xl">
              <FileText className="w-8 h-8 text-[#EBD8BE]" />
            </div>
            Admin Reports
          </h1>
          <p className="text-white/60 mt-2 font-medium">View and analyze school-wide student data demographics.</p>
        </div>
      </div>

      {/* Student Demographics Report */}
      <div className="bg-[#131E3A]/50 border border-white/5 shadow-xl rounded-3xl p-6 md:p-8 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#62D4CA]/15 rounded-xl border border-[#62D4CA]/20">
              <PieChart className="w-5 h-5 text-[#62D4CA]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Student Demographics</h2>
              <p className="text-sm text-white/50 mt-1">Breakdown of total student population.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto bg-[#0B132B] p-2 rounded-2xl border border-white/5">
            <span className="text-[11px] text-white/50 uppercase font-bold tracking-widest pl-2 whitespace-nowrap">Group By:</span>
            <select 
              value={demographicFilter}
              onChange={(e) => setDemographicFilter(e.target.value)}
              className="flex-1 sm:w-48 bg-[#131E3A] border-none text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#62D4CA]/50 font-medium transition-shadow cursor-pointer"
            >
              <option value="community">Community</option>
              <option value="class">Class</option>
              <option value="section">Section</option>
              <option value="gender">Gender</option>
            </select>
          </div>
        </div>
        
        {renderDemographics()}
      </div>
    </div>
  );
}
