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
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teachers, setTeachers] = useState([]);

  // Swap / Edit Modal State
  const [selectedCell, setSelectedCell] = useState(null);
  const [swapTarget, setSwapTarget] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchTimetable();
  }, [academicYear]);

  useEffect(() => {
    if (classConfigs.length > 0 && !selectedStandard) {
      const standards = [...new Set(classConfigs.map(c => c.standard))].sort();
      setSelectedStandard(standards[0] || '');
      const sections = classConfigs.filter(c => c.standard === standards[0]).map(c => c.section).sort();
      setSelectedSection(sections[0] || '');
    }
  }, [classConfigs]);

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

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.getTimetable({ academicYear });
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
      fetchTimetable();
    } catch (err) {
      console.error('Failed to generate timetable', err);
      setSummary({
        error: err.message || 'Generation failed',
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
    if (timetable.length === 0) {
      return <div className="p-8 text-center text-gray-500">No timetable generated for this academic year yet.</div>;
    }

    // Default to 8 periods
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];
    const days = DEFAULT_WORKING_DAYS;

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
                  const cellData = getCellData(day, p);
                  
                  return (
                    <td 
                      key={p} 
                      className={`p-2 border-r border-gray-200 transition-colors ${cellData ? 'cursor-pointer hover:bg-blue-50' : 'bg-gray-100/50'}`}
                      onClick={() => handleCellClick(day, p, cellData)}
                    >
                      {cellData ? (
                        <div className="flex flex-col text-sm h-full justify-center">
                          <span className="font-semibold text-gray-900">{viewMode === 'teacher' ? `${cellData.standard}-${cellData.section}` : cellData.subjectName}</span>
                          <span className="text-gray-500 text-xs mt-1">{viewMode === 'teacher' ? cellData.subjectName : cellData.teacherName}</span>
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
        <div className="flex gap-3">
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
        <GlassCard className={`p-4 border-l-4 ${summary.error ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
          <h3 className={`font-bold flex items-center ${summary.error ? 'text-red-800' : 'text-green-800'}`}>
            {summary.error ? <AlertTriangle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
            {summary.error ? 'Generation Failed' : 'Generation Complete'}
          </h3>
          {summary.error && <p className="text-red-700 mt-2">{summary.error}</p>}
          {summary.details && summary.details.length > 0 && (
            <ul className="list-disc ml-6 mt-2 text-red-600 text-sm">
              {summary.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
          {summary.message && <p className="text-green-700 mt-2">{summary.message} ({summary.scheduleCount} slots created)</p>}
          {summary.warnings && summary.warnings.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 rounded text-yellow-800 text-sm border border-yellow-200">
              <h4 className="font-semibold mb-1">Warnings:</h4>
              <ul className="list-disc ml-5">
                {summary.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </GlassCard>
      )}

      <GlassCard className="p-0 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex gap-4 flex-wrap items-center">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'class' ? 'bg-adminSidebar text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewMode('class')}
            >
              Class View
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'teacher' ? 'bg-adminSidebar text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewMode('teacher')}
            >
              Teacher View
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2 hidden sm:block"></div>

          {viewMode === 'class' ? (
            <div className="flex gap-2">
              <select 
                value={selectedStandard}
                onChange={e => {
                  setSelectedStandard(e.target.value);
                  const sections = classConfigs.filter(c => c.standard === e.target.value).map(c => c.section).sort();
                  setSelectedSection(sections[0] || '');
                }}
                className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-sm w-32"
              >
                {[...new Set(classConfigs.map(c => c.standard))].sort().map(std => (
                  <option key={std} value={std}>Std {std}</option>
                ))}
              </select>
              <select 
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-sm w-24"
              >
                {classConfigs.filter(c => c.standard === selectedStandard).map(c => c.section).sort().map(sec => (
                  <option key={sec} value={sec}>Sec {sec}</option>
                ))}
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
