import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { useClassConfig } from '../context/ClassConfigContext';
import { Calendar, RefreshCw, CheckCircle, AlertTriangle, Check, ArrowRightLeft } from 'lucide-react';

const DEFAULT_WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AdminTimetable() {
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  
  const { classConfigs } = useClassConfig();
  const [viewMode, setViewMode] = useState('class'); // class, teacher
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('published');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teachers, setTeachers] = useState([]);

  // Swap / Edit Modal State
  const [selectedCell, setSelectedCell] = useState(null);
  const [swapTarget, setSwapTarget] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchReadiness();
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [academicYear, selectedStandard, selectedSection, selectedStatus]);

  const fetchTeachers = async () => {
    try {
      const res = await api.getAllUsers();
      if (res) {
        setTeachers(res.filter(u => u.role === 'teacher' && u.isActive !== false));
      }
    } catch (err) {
      console.error('Failed to fetch teachers', err);
    }
  };

  const fetchReadiness = async () => {
    try {
      const res = await api.checkReadinessTimetable({ academicYear });
      if (res && res.ready) {
        setSummary({ code: 'READY' });
      }
    } catch (err) {
      if (err.code === 'TIMETABLE_SETUP_INCOMPLETE') {
        setSummary({
          code: err.code,
          error: err.error,
          missingAssignments: err.missingAssignments,
          ambiguousAssignments: err.ambiguousAssignments,
          missingClassTeachers: err.missingClassTeachers,
          duplicateClassTeachers: err.duplicateClassTeachers,
        });
      } else {
        console.error('Failed to check readiness', err);
      }
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const query = { academicYear };
      if (selectedStandard !== 'All') query.standard = selectedStandard;
      if (selectedSection !== 'All') query.section = selectedSection;
      
      const res = await api.getTimetable(query);
      setTimetable(res || []);
    } catch (err) {
      console.error('Failed to fetch timetable', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!window.confirm('Are you sure you want to generate a new timetable? This will overwrite the current draft.')) return;
    setIsGenerating(true);
    setSummary(null);
    try {
      const res = await api.generateTimetable({ academicYear });
      setSummary({
        message: res.message,
        warnings: res.warnings || [],
        scheduleCount: res.scheduleCount
      });
      setSelectedStatus('draft'); // Switch to draft view so user can see it
      fetchTimetable();
    } catch (err) {
      console.error('Failed to generate timetable', err);
      setSummary({
        error: err.message || 'Generation failed',
        code: err.code,
        missingAssignments: err.missingAssignments,
        ambiguousAssignments: err.ambiguousAssignments,
        missingClassTeachers: err.missingClassTeachers,
        duplicateClassTeachers: err.duplicateClassTeachers,
        conflicts: err.conflicts,
        details: err.validationErrors || err.errors || []
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to PUBLISH this timetable? It will be visible to all teachers and students.')) return;
    try {
      await api.publishTimetable({ academicYear });
      alert('Timetable published successfully!');
      setSelectedStatus('published'); // Switch to published view so user can see it
      fetchTimetable();
    } catch (err) {
      alert('Failed to publish: ' + err.message);
    }
  };

  const getCellData = (day, period) => {
    if (viewMode === 'class') {
      return timetable.find(t => t.day === day && t.period === period && t.standard === selectedStandard && t.section === selectedSection);
    } else {
      return timetable.find(t => t.day === day && t.period === period && t.teacherId === selectedTeacher);
    }
  };

  const handleCellClick = (day, period, data) => {
    if (!data) return; // Only allow editing existing slots for now
    setSelectedCell(data);
    setIsEditModalOpen(true);
  };

  // Render Grid
  const renderGrid = () => {
    // Filter the timetable by the selected status
    const visibleTimetable = timetable.filter(t => t.status === selectedStatus);

    if (visibleTimetable.length === 0) {
      const msg = (selectedStandard === 'All' && selectedSection === 'All') 
        ? `No ${selectedStatus} timetable generated for any class for this academic year.`
        : `No ${selectedStatus} timetable generated for this class and section for this academic year.`;
      return <div className="p-8 text-center text-gray-500">{msg}</div>;
    }

    const periods = [1, 2, 3, 4, 5, 6, 7, 8];
    const days = DEFAULT_WORKING_DAYS;

    if (viewMode === 'class') {
      const groups = {};
      visibleTimetable.forEach(t => {
        const key = `${t.standard}-${t.section}`;
        if (!groups[key]) groups[key] = { standard: t.standard, section: t.section, slots: [] };
        groups[key].slots.push(t);
      });
      const groupKeys = Object.keys(groups);
      
      // Sort groupKeys numerically by standard, then section
      groupKeys.sort((a, b) => {
        const stdA = parseInt(groups[a].standard, 10);
        const stdB = parseInt(groups[b].standard, 10);
        if (stdA !== stdB) return stdA - stdB;
        return groups[a].section.localeCompare(groups[b].section, undefined, { numeric: true });
      });

      return (
        <div className="space-y-8 mt-6">
          {groupKeys.map(key => {
            const { standard, section, slots } = groups[key];
            return (
              <div key={key}>
                <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wider">
                  STD {standard} — SECTION {section}
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-center border-collapse">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="p-3 border-b border-r font-medium border-gray-200">Day / Period</th>
                        {periods.map(p => (
                          <th key={p} className="p-3 border-b border-r font-medium border-gray-200">P{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {days.map(day => (
                        <tr key={day} className="border-b border-gray-200 hover:bg-gray-50/50">
                          <td className="p-3 border-r font-medium text-gray-800 bg-gray-50/30">{day}</td>
                          {periods.map(p => {
                            const cellData = slots.find(t => t.day === day && t.period === p);
                            return (
                              <td 
                                key={p} 
                                className={`p-2 border-r border-gray-200 transition-colors ${cellData ? 'cursor-pointer hover:bg-blue-50' : 'bg-gray-100/50'}`}
                                onClick={() => handleCellClick(day, p, cellData)}
                              >
                                {cellData ? (
                                  <div className="flex flex-col text-sm h-full justify-center relative">
                                    <span className="font-semibold text-gray-900">{cellData.subjectName}</span>
                                    <span className="text-gray-500 text-xs mt-1">{cellData.teacherName}</span>
                                    {cellData.status === 'draft' && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400" title="Draft"></span>}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">FREE</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      // Teacher View rendering (Single Table)
      return (
        <div className="overflow-x-auto mt-6 border border-gray-200 rounded-xl">
          <table className="w-full text-center border-collapse">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 border-b border-r font-medium border-gray-200">Day / Period</th>
                {periods.map(p => (
                  <th key={p} className="p-3 border-b border-r font-medium border-gray-200">P{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day} className="border-b border-gray-200 hover:bg-gray-50/50">
                  <td className="p-3 border-r font-medium text-gray-800 bg-gray-50/30">{day}</td>
                  {periods.map(p => {
                    const cellData = visibleTimetable.find(t => t.day === day && t.period === p && t.teacherId === selectedTeacher);
                    return (
                      <td 
                        key={p} 
                        className={`p-2 border-r border-gray-200 transition-colors ${cellData ? 'cursor-pointer hover:bg-blue-50' : 'bg-gray-100/50'}`}
                        onClick={() => handleCellClick(day, p, cellData)}
                      >
                        {cellData ? (
                          <div className="flex flex-col text-sm h-full justify-center relative">
                            <span className="font-semibold text-gray-900">{cellData.standard}-{cellData.section}</span>
                            <span className="text-gray-500 text-xs mt-1">{cellData.subjectName}</span>
                            {cellData.status === 'draft' && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400" title="Draft"></span>}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">FREE</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  const draftsCount = timetable.filter(t => t.status === 'draft').length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-7 h-7 mr-3 text-adminSidebar" />
            Timetable Management
          </h1>
          <p className="text-gray-500 mt-1">Generate, edit, and publish school timetables</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <select 
            value={academicYear} 
            onChange={e => setAcademicYear(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
          >
            <option value="2025-26">2025-26</option>
            <option value="2026-27">2026-27</option>
          </select>
          <NeonButton onClick={handleGenerate} disabled={isGenerating || loading} className="bg-adminSidebar text-white whitespace-nowrap">
            {isGenerating ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin inline" /> Generating...</> : 'Generate Timetable'}
          </NeonButton>
          {draftsCount > 0 && (
            <NeonButton onClick={handlePublish} variant="secondary" className="whitespace-nowrap">
              Publish Drafts
            </NeonButton>
          )}
        </div>
      </div>

      {summary && (
        <GlassCard className="p-6">
          {summary.message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Generation Successful</h3>
              <p className="text-sm text-green-700">{summary.message}</p>
              {summary.warnings && summary.warnings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <h4 className="text-sm font-medium text-amber-800 mb-1">Warnings ({summary.warnings.length}):</h4>
                  <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                    {summary.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          {summary && summary.code === 'READY' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 mb-1">READY TO GENERATE</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Teacher assignments complete</li>
                  <li>✓ Class Teachers complete</li>
                  <li>✓ No ambiguous assignments</li>
                </ul>
              </div>
            </div>
          )}
          
          {summary && summary.code !== 'READY' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">
                {summary.code === 'TIMETABLE_SETUP_INCOMPLETE' || summary.code === 'MISSING_TEACHER_ASSIGNMENTS' ? 'TIMETABLE SETUP INCOMPLETE' : 'Generation Failed'}
              </h3>
              
              {summary.code === 'TIMETABLE_SETUP_INCOMPLETE' || summary.code === 'MISSING_TEACHER_ASSIGNMENTS' ? (
                <div className="text-sm text-red-700">
                  <p className="mb-3 font-semibold">
                    The following setup issues must be resolved before generating the timetable:
                  </p>
                  
                  {summary.missingClassTeachers?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-bold mb-1">Missing Class Teachers ({summary.missingClassTeachers.length})</h4>
                      <table className="w-full text-left bg-white border border-red-200">
                        <thead className="bg-red-100"><tr><th className="p-2">Standard</th><th className="p-2">Section</th></tr></thead>
                        <tbody>
                          {summary.missingClassTeachers.map((mct, idx) => (
                            <tr key={`mct-${idx}`} className="border-t border-red-100"><td className="p-2">{mct.standard}</td><td className="p-2">{mct.section}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {summary.duplicateClassTeachers?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-bold mb-1">Duplicate Class Teachers ({summary.duplicateClassTeachers.length})</h4>
                      <table className="w-full text-left bg-white border border-red-200">
                        <thead className="bg-red-100"><tr><th className="p-2">Standard</th><th className="p-2">Section</th><th className="p-2">Teachers</th></tr></thead>
                        <tbody>
                          {summary.duplicateClassTeachers.map((dct, idx) => (
                            <tr key={`dct-${idx}`} className="border-t border-red-100 bg-orange-50">
                              <td className="p-2">{dct.standard}</td><td className="p-2">{dct.section}</td>
                              <td className="p-2 text-xs">{dct.teachers.map(t => t.name).join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {summary.ambiguousAssignments?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-bold mb-1">Ambiguous Assignments ({summary.ambiguousAssignments.length})</h4>
                      <table className="w-full text-left bg-white border border-red-200">
                        <thead className="bg-red-100"><tr><th className="p-2">Standard</th><th className="p-2">Section</th><th className="p-2">Subject</th><th className="p-2">Reason</th><th className="p-2">Teachers</th></tr></thead>
                        <tbody>
                          {summary.ambiguousAssignments.map((aa, idx) => (
                            <tr key={`amb-${idx}`} className="border-t border-red-100 bg-orange-50">
                              <td className="p-2">{aa.standard}</td><td className="p-2">{aa.section}</td><td className="p-2 font-medium">{aa.subject}</td>
                              <td className="p-2 font-medium text-orange-700">{aa.reason === 'AMBIGUOUS_EXACT_SUBJECT_ASSIGNMENT' ? 'Multiple exact teachers' : 'Multiple All Subjects teachers'}</td>
                              <td className="p-2 text-xs">{aa.teachers.map(t => t.name).join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {summary.missingAssignments?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-bold mb-1">Missing Subject Teachers ({summary.missingAssignments.length})</h4>
                      <table className="w-full text-left bg-white border border-red-200">
                        <thead className="bg-red-100"><tr><th className="p-2">Standard</th><th className="p-2">Section</th><th className="p-2">Subject</th></tr></thead>
                        <tbody>
                          {summary.missingAssignments.map((ma, idx) => (
                            <tr key={`miss-${idx}`} className="border-t border-red-100">
                              <td className="p-2">{ma.standard}</td><td className="p-2">{ma.section}</td><td className="p-2 font-medium">{ma.subject}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex gap-4 mt-4 mb-4">
                    <button
                      onClick={fetchReadiness}
                      className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium bg-white"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Setup Status
                    </button>
                  </div>

                  <button 
                    onClick={() => window.location.href = '/admin/users'}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Go to User Management
                  </button>
                </div>
              ) : summary.code === 'TIMETABLE_GENERATION_CONFLICT' ? (
                <div className="text-sm text-red-700">
                  <p className="mb-3 font-semibold">
                    The timetable could not be completely scheduled due to the following constraint conflicts:
                  </p>
                  
                  {summary.conflicts?.length > 0 && (
                    <div className="mb-4">
                      <table className="w-full text-left bg-white border border-red-200">
                        <thead className="bg-red-100">
                          <tr>
                            <th className="p-2">Class</th>
                            <th className="p-2">Subject</th>
                            <th className="p-2">Teacher</th>
                            <th className="p-2">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.conflicts.map((c, idx) => (
                            <tr key={`conf-${idx}`} className="border-t border-red-100">
                              <td className="p-2">{c.standard}-{c.section}</td>
                              <td className="p-2 font-medium">{c.subject}</td>
                              <td className="p-2">{c.teacher}</td>
                              <td className="p-2 text-red-800">{c.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                  <li>{summary.error}</li>
                  {summary.details && summary.details.map((errDetail, idx) => (
                    <li key={idx}>{errDetail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </GlassCard>
      )}

      <GlassCard className="p-0 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex gap-4 flex-wrap items-center">
          <div className="flex w-full sm:w-auto bg-white rounded-lg border border-gray-200 p-1">
            <button 
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${viewMode === 'class' ? 'bg-adminSidebar text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewMode('class')}
            >
              Class View
            </button>
            <button 
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${viewMode === 'teacher' ? 'bg-adminSidebar text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewMode('teacher')}
            >
              Teacher View
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2 hidden sm:block"></div>

          {viewMode === 'class' ? (
            <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
              <select 
                value={selectedStandard}
                onChange={e => {
                  setSelectedStandard(e.target.value);
                  setSelectedSection('All');
                }}
                className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-sm flex-1 md:flex-none md:w-32"
              >
                <option value="All">All Classes</option>
                {[...new Set(classConfigs.map(c => parseInt(c.standard, 10)))].sort((a,b) => a - b).map(std => (
                  <option key={std} value={std.toString()}>Std {std}</option>
                ))}
              </select>
              <select 
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-sm flex-1 md:flex-none md:w-32"
              >
                <option value="All">All Sections</option>
                {[...new Set(classConfigs
                  .filter(c => selectedStandard === 'All' || c.standard == selectedStandard)
                  .map(c => c.section))]
                  .sort((a,b) => a.localeCompare(b, undefined, {numeric: true}))
                  .map(sec => (
                  <option key={sec} value={sec}>Sec {sec}</option>
                ))}
              </select>
              <select 
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-sm w-full sm:w-auto sm:flex-1 md:flex-none md:w-32"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                value={selectedTeacher}
                onChange={e => setSelectedTeacher(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-sm flex-1 min-w-[200px]"
              >
                <option value="">-- Select Teacher --</option>
                {teachers.map(t => (
                  <option key={t.uid} value={t.uid}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-4 relative">
          {loading && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">Loading timetable...</div>}
          
          <div className="flex items-center gap-4 mb-2 text-sm text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Draft</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span> Published</span>
            {draftsCount > 0 && <span className="ml-auto text-orange-500 font-medium">{draftsCount} Drafts need publishing</span>}
          </div>

          {(viewMode === 'teacher' && !selectedTeacher) ? (
            <div className="p-12 text-center text-gray-400 border border-dashed rounded-xl mt-4">
              Select a teacher to view their timetable
            </div>
          ) : renderGrid()}
        </div>
      </GlassCard>

      {/* Edit Modal for basic rearrangement notice */}
      {isEditModalOpen && selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Manage Timetable Slot</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Current Assignment</p>
              <p className="font-semibold text-gray-900">{selectedCell.standard}-{selectedCell.section}</p>
              <p className="text-gray-800">{selectedCell.subjectName}</p>
              <p className="text-gray-600">{selectedCell.teacherName}</p>
              <p className="text-xs text-gray-500 mt-2">{selectedCell.day}, Period {selectedCell.period}</p>
            </div>
            
            <p className="text-sm text-gray-600 italic">
              Advanced drag-and-drop manual editing and swapping requires full frontend implementation. 
              The backend validation is ready (`/api/timetable/validate`).
            </p>

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
              >
                Close
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
