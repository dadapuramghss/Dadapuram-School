import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { PieChart, FileText, Download, X } from 'lucide-react';
import Papa from 'papaparse';

export function AdminReports() {
  const [allStudents, setAllStudents] = useState([]);
  const [demographicFilter, setDemographicFilter] = useState('community');
  const [selectedGroup, setSelectedGroup] = useState(null);
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

  // Reset selected group when filter changes
  useEffect(() => {
    setSelectedGroup(null);
  }, [demographicFilter]);

  const getGroupKey = (student, filter) => {
    if (filter === 'community') return student.community ? student.community.toUpperCase() : 'UNKNOWN';
    if (filter === 'class') return `Standard ${student.standard || 'Unknown'}`;
    if (filter === 'section') return `Section ${student.section || 'Unknown'}`;
    if (filter === 'gender') return student.gender || 'Unknown';
    return 'UNKNOWN';
  };

  const handleDownloadCSV = (groupKey, studentsToDownload) => {
    if (!studentsToDownload || studentsToDownload.length === 0) return;
    
    const csvData = studentsToDownload.map(student => ({
      'EMIS Number': student.emisNumber || '',
      'Name': student.name || '',
      'Gender': student.gender || '',
      'Community': student.community || '',
      'Standard': student.standard || '',
      'Section': student.section || '',
      'Phone': student.phone || '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${groupKey}_students_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDemographics = () => {
    if (loading) return <div className="text-white/40 text-center py-10 font-medium">Loading report data...</div>;
    if (!allStudents.length) return <div className="text-white/40 text-center py-10 font-medium">No student data available for reports.</div>;
    
    const grouped = allStudents.reduce((acc, curr) => {
      const key = getGroupKey(curr, demographicFilter);
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {});

    // Sort entries alphabetically by key
    const sortedEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

    const selectedStudents = selectedGroup ? grouped[selectedGroup] || [] : [];

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {sortedEntries.map(([key, studentsInGroup]) => {
            const isSelected = selectedGroup === key;
            return (
              <div 
                key={key} 
                onClick={() => setSelectedGroup(isSelected ? null : key)}
                className={`border rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? 'bg-[#62D4CA]/20 border-[#62D4CA] shadow-[0_0_15px_rgba(98,212,202,0.2)]' 
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-lg'
                }`}
              >
                <span className={`text-xs font-bold uppercase tracking-widest mb-3 text-center ${isSelected ? 'text-[#62D4CA]' : 'text-[#EBD8BE]/70'}`}>
                  {key}
                </span>
                <span className={`text-4xl font-black drop-shadow-sm ${isSelected ? 'text-white' : 'text-white'}`}>
                  {studentsInGroup.length}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Group Preview Section */}
        {selectedGroup && (
          <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-[#0B132B] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 md:p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#62D4CA]"></span>
                    {selectedGroup} Students Preview
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-xs font-bold">
                    {selectedStudents.length} Total
                  </span>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleDownloadCSV(selectedGroup, selectedStudents)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#62D4CA]/10 hover:bg-[#62D4CA]/20 text-[#62D4CA] border border-[#62D4CA]/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                  <button 
                    onClick={() => setSelectedGroup(null)}
                    className="p-2 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase tracking-wider text-white/50 font-bold">
                      <th className="p-4 font-semibold">EMIS Number</th>
                      <th className="p-4 font-semibold">Name</th>
                      <th className="p-4 font-semibold">Class & Section</th>
                      <th className="p-4 font-semibold">Gender</th>
                      <th className="p-4 font-semibold">Community</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm text-white/70 font-medium">{student.emisNumber || 'N/A'}</td>
                        <td className="p-4 text-sm font-bold text-[#EBD8BE]">{student.name}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#5D7D9A]/10 text-[#5D7D9A] border border-[#5D7D9A]/20">
                            {student.standard} - {student.section}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-white/70">{student.gender || 'N/A'}</td>
                        <td className="p-4 text-sm text-white/70">{student.community || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </>
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
