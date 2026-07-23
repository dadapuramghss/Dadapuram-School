import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { PieChart, FileText, Download, X, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';

export function AdminReports() {
  const [allStudents, setAllStudents] = useState([]);
  const [demographicFilter, setDemographicFilter] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

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
    if (filter === 'all') return 'ALL STUDENTS';
    return 'UNKNOWN';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const mapStudentToExcelRow = (student) => ({
    'EMIS Num': student.emisNumber || student.rollNumber || '',
    'Name': student.name || '',
    'Standard': student.standard || '',
    'Section': student.section || '',
    'Gender': student.gender || '',
    'Medium': student.medium || '',
    'Tamil Nam': student.tamilName || '',
    'Father Nam': student.fatherName || '',
    'DOB': formatDate(student.dob),
    'Admission': student.admissionNumber || '',
    'Religion': student.religion || '',
    'Communit': student.community || '',
    'Address': student.address || '',
    'Mobile Number': student.mobileNumber || ''
  });

  const handleDownloadExcel = (groupKey, studentsToDownload) => {
    if (!studentsToDownload || studentsToDownload.length === 0) return;
    
    const excelData = studentsToDownload.map(mapStudentToExcelRow);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    
    XLSX.writeFile(workbook, `${groupKey.replace(/[^a-zA-Z0-9]/g, '_')}_students_report.xlsx`);
  };

  const handleDownloadSingleStudent = (student) => {
    handleDownloadExcel(student.name, [student]);
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
                    onClick={() => handleDownloadExcel(selectedGroup, selectedStudents)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#62D4CA]/10 hover:bg-[#62D4CA]/20 text-[#62D4CA] border border-[#62D4CA]/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Excel
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
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm text-white/70 font-medium">{student.emisNumber || student.rollNumber || 'N/A'}</td>
                        <td className="p-4 text-sm font-bold text-[#EBD8BE]">{student.name}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#5D7D9A]/10 text-[#5D7D9A] border border-[#5D7D9A]/20">
                            {student.standard} - {student.section}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-white/70">{student.gender || 'N/A'}</td>
                        <td className="p-4 text-sm text-white/70">{student.community || 'N/A'}</td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedStudentDetails(student)}
                            className="p-2 bg-[#62D4CA]/10 hover:bg-[#62D4CA]/20 text-[#62D4CA] rounded-xl transition-colors"
                            title="View Student Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDownloadSingleStudent(student)}
                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors"
                            title="Download Student Record"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
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
              <option value="all">All</option>
            </select>
          </div>
        </div>
        
        {renderDemographics()}
      </div>

      {/* Student Details Modal */}
      {selectedStudentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B132B] border border-white/10 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#62D4CA]"></span>
                Student Details
              </h3>
              <button 
                onClick={() => setSelectedStudentDetails(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Personal Info */}
                <div className="space-y-4">
                  <h4 className="text-[#62D4CA] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-2">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Full Name</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Tamil Name</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.tamilName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Gender</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Date of Birth</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.dob || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Father's Name</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.fatherName || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="space-y-4">
                  <h4 className="text-[#F9CB84] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-2">Academic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">EMIS Number</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.emisNumber || selectedStudentDetails.rollNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Admission Number</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.admissionNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Class & Section</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.standard} - {selectedStudentDetails.section}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Medium</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.medium || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4 md:col-span-2">
                  <h4 className="text-[#EBD8BE] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-2">Contact & Background</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Mobile Number</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.mobileNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Religion / Community</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.religion || 'N/A'} / {selectedStudentDetails.community || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Address</p>
                      <p className="text-sm font-semibold text-white">{selectedStudentDetails.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
              <button 
                onClick={() => setSelectedStudentDetails(null)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
