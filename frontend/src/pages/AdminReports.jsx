import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { FileText, Download, X, Eye, Grid } from 'lucide-react';
import * as XLSX from 'xlsx';

export function AdminReports() {
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  
  // Matrix specific state
  const [selectedMatrixGroup, setSelectedMatrixGroup] = useState(null);
  const [selectedMatrixStudents, setSelectedMatrixStudents] = useState([]);

  const [matrixRow, setMatrixRow] = useState(['standard']);
  const [matrixCol, setMatrixCol] = useState(['gender']);
  const [showGlobalPreview, setShowGlobalPreview] = useState(false);
  
  // Reset preview when dimensions change
  useEffect(() => {
    setSelectedMatrixGroup(null);
    setSelectedMatrixStudents([]);
    setShowGlobalPreview(false);
  }, [matrixRow, matrixCol]);
  
  const matrixDimensions = [
    { id: 'standard', label: 'Class' },
    { id: 'section', label: 'Section' },
    { id: 'gender', label: 'Gender' },
    { id: 'community', label: 'Community' },
    { id: 'religion', label: 'Religion' },
    { id: 'medium', label: 'Medium' }
  ];

  const getDimensionValue = (student, dimIds) => {
    if (!Array.isArray(dimIds)) dimIds = [dimIds];
    if (dimIds.length === 0) return 'ALL';
    return dimIds.map(dimId => {
      const val = student[dimId];
      return val ? String(val).toUpperCase() : 'UNKNOWN';
    }).join(' - ');
  };

  const toggleDimension = (type, id) => {
    if (type === 'row') {
      setMatrixRow(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    } else {
      setMatrixCol(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    }
  };

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

  const handleDownloadMatrixExcel = (matrixData, rowValues, colValues, rowLabel, colLabel) => {
    const excelData = [];
    rowValues.forEach(rowVal => {
      const rowData = { [rowLabel]: rowVal };
      colValues.forEach(colVal => {
        rowData[colVal] = matrixData[rowVal]?.[colVal] || 0;
      });
      rowData['Total'] = matrixData[rowVal]?.total || 0;
      excelData.push(rowData);
    });
    const totalRow = { [rowLabel]: 'GRAND TOTAL' };
    colValues.forEach(colVal => {
      totalRow[colVal] = matrixData.colTotals?.[colVal] || 0;
    });
    totalRow['Total'] = matrixData.grandTotal || 0;
    excelData.push(totalRow);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Matrix Report");
    XLSX.writeFile(workbook, `Matrix_Report_${rowLabel}_vs_${colLabel}.xlsx`);
  };

  const renderMatrixReport = () => {
    if (loading) return <div className="text-white/40 text-center py-10 font-medium">Loading report data...</div>;
    if (!allStudents.length) return <div className="text-white/40 text-center py-10 font-medium">No student data available for reports.</div>;

    const matrixData = { 
      grandTotal: 0, 
      colTotals: {}, 
      colStudents: {}, 
      grandTotalStudents: [] 
    };
    const rowSet = new Set();
    const colSet = new Set();

    allStudents.forEach(student => {
      const rVal = getDimensionValue(student, matrixRow);
      const cVal = getDimensionValue(student, matrixCol);
      rowSet.add(rVal);
      colSet.add(cVal);

      if (!matrixData[rVal]) {
        matrixData[rVal] = { total: 0, students: {}, totalStudents: [] };
      }
      if (!matrixData[rVal].students[cVal]) {
        matrixData[rVal].students[cVal] = [];
      }
      
      // Store counts
      matrixData[rVal][cVal] = (matrixData[rVal][cVal] || 0) + 1;
      matrixData[rVal].total += 1;
      matrixData.colTotals[cVal] = (matrixData.colTotals[cVal] || 0) + 1;
      matrixData.grandTotal += 1;
      
      // Store actual student objects for preview
      matrixData[rVal].students[cVal].push(student);
      matrixData[rVal].totalStudents.push(student);
      
      if (!matrixData.colStudents[cVal]) {
        matrixData.colStudents[cVal] = [];
      }
      matrixData.colStudents[cVal].push(student);
      matrixData.grandTotalStudents.push(student);
    });

    const customSort = (a, b) => {
      if (a === 'UNKNOWN') return 1;
      if (b === 'UNKNOWN') return -1;
      // Handle combined keys sorting by sorting each part
      const partsA = a.split(' - ');
      const partsB = b.split(' - ');
      for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
        const pA = partsA[i];
        const pB = partsB[i];
        const numA = parseInt(pA);
        const numB = parseInt(pB);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
        if (pA !== pB) return pA.localeCompare(pB);
      }
      return partsA.length - partsB.length;
    };

    const rowValues = Array.from(rowSet).sort(customSort);
    const colValues = Array.from(colSet).sort(customSort);

    const rowLabel = matrixRow.map(id => matrixDimensions.find(d => d.id === id)?.label).filter(Boolean).join(' - ') || 'Row';
    const colLabel = matrixCol.map(id => matrixDimensions.find(d => d.id === id)?.label).filter(Boolean).join(' - ') || 'Column';

    return (
      <div className="mt-6 animate-in slide-in-from-top-4 duration-300">
        <div className="bg-[#0B132B] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-4 md:p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F9CB84]"></span>
                {rowLabel} vs {colLabel} Breakdown
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-[11px] uppercase tracking-wider text-white/50 font-bold">
                  <th className="p-4 text-left border-r border-white/5 bg-white/5">{rowLabel} \ {colLabel}</th>
                  {colValues.map(c => (
                    <th key={c} className="p-4 bg-white/[0.01]">{c}</th>
                  ))}
                  <th className="p-4 text-white/80 bg-white/5 border-l border-white/5">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {rowValues.map(r => (
                  <tr key={r} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-left font-bold text-[#EBD8BE] border-r border-white/5 bg-white/[0.01]">{r}</td>
                    {colValues.map(c => {
                      const count = matrixData[r]?.[c] || 0;
                      return (
                        <td key={c} className="p-4 text-white/70">
                          {count > 0 ? (
                            <button 
                              onClick={() => {
                                setSelectedMatrixGroup(`${r} / ${c}`);
                                setSelectedMatrixStudents(matrixData[r].students[c]);
                              }}
                              className="hover:text-[#62D4CA] underline decoration-dashed underline-offset-4 transition-colors"
                            >
                              {count}
                            </button>
                          ) : (
                            0
                          )}
                        </td>
                      );
                    })}
                    <td className="p-4 font-bold text-[#F9CB84] bg-white/[0.03] border-l border-white/5">
                      {matrixData[r]?.total > 0 ? (
                        <button 
                          onClick={() => {
                            setSelectedMatrixGroup(`${r} (Total)`);
                            setSelectedMatrixStudents(matrixData[r].totalStudents);
                          }}
                          className="hover:text-white underline decoration-dashed underline-offset-4 transition-colors"
                        >
                          {matrixData[r].total}
                        </button>
                      ) : (
                        0
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-white/[0.03] font-bold text-white border-t-2 border-white/10">
                  <td className="p-4 text-left border-r border-white/5 text-[#EBD8BE]">GRAND TOTAL</td>
                  {colValues.map(c => {
                    const count = matrixData.colTotals[c] || 0;
                    return (
                      <td key={c} className="p-4 text-[#62D4CA]">
                        {count > 0 ? (
                          <button 
                            onClick={() => {
                              setSelectedMatrixGroup(`${c} (Total)`);
                              setSelectedMatrixStudents(matrixData.colStudents[c]);
                            }}
                            className="hover:text-white underline decoration-dashed underline-offset-4 transition-colors"
                          >
                            {count}
                          </button>
                        ) : (
                          0
                        )}
                      </td>
                    );
                  })}
                  <td className="p-4 text-white bg-[#F9CB84]/15 border-l border-white/5">
                    {matrixData.grandTotal > 0 ? (
                      <button 
                        onClick={() => {
                          setSelectedMatrixGroup(`Grand Total`);
                          setSelectedMatrixStudents(matrixData.grandTotalStudents);
                        }}
                        className="hover:text-white underline decoration-dashed underline-offset-4 transition-colors"
                      >
                        {matrixData.grandTotal}
                      </button>
                    ) : (
                      0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                setSelectedMatrixGroup("Custom Matrix Report");
                setSelectedMatrixStudents(matrixData.grandTotalStudents);
              }}
              className="flex items-center justify-center gap-2 bg-[#62D4CA]/10 hover:bg-[#62D4CA]/20 text-[#62D4CA] border border-[#62D4CA]/30 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <Eye className="w-4.5 h-4.5" />
              Preview
            </button>
            <button 
              onClick={() => handleDownloadMatrixExcel(matrixData, rowValues, colValues, rowLabel, colLabel)}
              className="flex items-center justify-center gap-2 bg-[#F9CB84]/10 hover:bg-[#F9CB84]/20 text-[#F9CB84] border border-[#F9CB84]/30 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <Download className="w-4.5 h-4.5" />
              Download Excel
            </button>
          </div>
        </div>

        {/* Selected Group Preview Section */}
        {selectedMatrixGroup && selectedMatrixStudents.length > 0 && (
          <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-[#0B132B] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-4 md:p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#62D4CA]"></span>
                    {selectedMatrixGroup} Students Preview
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-xs font-bold">
                    {selectedMatrixStudents.length} Total
                  </span>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleDownloadExcel(selectedMatrixGroup, selectedMatrixStudents)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#62D4CA]/10 hover:bg-[#62D4CA]/20 text-[#62D4CA] border border-[#62D4CA]/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Excel
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedMatrixGroup(null);
                      setSelectedMatrixStudents([]);
                    }}
                    className="p-2 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse relative">
                  <thead className="sticky top-0 bg-[#0B132B] z-10 shadow-md">
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
                    {selectedMatrixStudents.map((student) => (
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

      {/* Custom Matrix Report Builder */}
      <div className="bg-[#131E3A]/50 border border-white/5 shadow-xl rounded-3xl p-6 md:p-8 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F9CB84]/15 rounded-xl border border-[#F9CB84]/20">
              <Grid className="w-5 h-5 text-[#F9CB84]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Custom Matrix Report</h2>
              <p className="text-sm text-white/50 mt-1">Cross-tabulate student data by selecting dimensions.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Row Selection */}
          <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5 shadow-inner">
            <h3 className="text-xs text-[#EBD8BE] uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EBD8BE]"></span>
              Select Row Dimension
            </h3>
            <div className="flex flex-wrap gap-3">
              {matrixDimensions.map(dim => {
                const isSelected = matrixRow.includes(dim.id);
                const isDisabled = matrixCol.includes(dim.id);
                return (
                  <label key={`row-${dim.id}`} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected ? 'bg-[#F9CB84]/20 border-[#F9CB84] text-[#F9CB84] shadow-[0_0_10px_rgba(249,203,132,0.2)]' : 
                    isDisabled ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed' : 
                    'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}>
                    <input 
                      type="checkbox" 
                      name="matrixRow" 
                      value={dim.id} 
                      checked={isSelected} 
                      disabled={isDisabled}
                      onChange={() => toggleDimension('row', dim.id)}
                      className="hidden" 
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'border-[#F9CB84] bg-[#F9CB84]/20' : 'border-white/30'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-sm bg-[#F9CB84]" />}
                    </div>
                    <span className="text-sm font-medium">{dim.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          
          {/* Column Selection */}
          <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5 shadow-inner">
            <h3 className="text-xs text-[#62D4CA] uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#62D4CA]"></span>
              Select Column Dimension
            </h3>
            <div className="flex flex-wrap gap-3">
              {matrixDimensions.map(dim => {
                const isSelected = matrixCol.includes(dim.id);
                const isDisabled = matrixRow.includes(dim.id);
                return (
                  <label key={`col-${dim.id}`} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected ? 'bg-[#62D4CA]/20 border-[#62D4CA] text-[#62D4CA] shadow-[0_0_10px_rgba(98,212,202,0.2)]' : 
                    isDisabled ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed' : 
                    'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}>
                    <input 
                      type="checkbox" 
                      name="matrixCol" 
                      value={dim.id} 
                      checked={isSelected} 
                      disabled={isDisabled}
                      onChange={() => toggleDimension('col', dim.id)}
                      className="hidden" 
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'border-[#62D4CA] bg-[#62D4CA]/20' : 'border-white/30'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-sm bg-[#62D4CA]" />}
                    </div>
                    <span className="text-sm font-medium">{dim.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {renderMatrixReport()}
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
