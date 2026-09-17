import React, { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { useClassConfig } from '../context/ClassConfigContext';
import { Trash2, Edit2, Plus, Settings, Calendar } from 'lucide-react';

const DEFAULT_WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AdminClasses() {
  const { classConfigs, loadingConfigs, refreshConfigs } = useClassConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'timetable'
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({ standard: '', section: '', subjects: '' });
  
  const [timetableData, setTimetableData] = useState({
    workingDays: [...DEFAULT_WORKING_DAYS],
    periodsPerDay: 8,
    periodTimings: [],
    subjectFrequencies: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        standard: config.standard,
        section: config.section,
        subjects: config.subjects.join(', ')
      });
      
      const tt = config.timetableConfig || {};
      setTimetableData({
        workingDays: tt.workingDays?.length ? tt.workingDays : [...DEFAULT_WORKING_DAYS],
        periodsPerDay: tt.periodsPerDay || 8,
        periodTimings: tt.periodTimings || [],
        subjectFrequencies: tt.subjectFrequencies || config.subjects.map(s => ({
          subjectId: s,
          subjectName: s,
          weeklyPeriods: 6,
          type: 'subject'
        }))
      });
    } else {
      setEditingConfig(null);
      setFormData({ standard: '', section: '', subjects: '' });
      setTimetableData({
        workingDays: [...DEFAULT_WORKING_DAYS],
        periodsPerDay: 8,
        periodTimings: [],
        subjectFrequencies: []
      });
    }
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConfig(null);
  };

  // When subjects text changes, sync subjectFrequencies
  const handleSubjectsChange = (e) => {
    const text = e.target.value;
    setFormData({ ...formData, subjects: text });
    const parsed = text.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    // Keep existing frequencies if they match by name
    const newFreqs = parsed.map(s => {
      const existing = timetableData.subjectFrequencies.find(f => f.subjectName === s);
      if (existing) return existing;
      return {
        subjectId: s,
        subjectName: s,
        weeklyPeriods: 6,
        type: s.toLowerCase() === 'pt' ? 'pt' : s.toLowerCase() === 'art' ? 'art' : 'subject'
      };
    });
    setTimetableData({ ...timetableData, subjectFrequencies: newFreqs });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const parsedSubjects = formData.subjects
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const cleanStandard = formData.standard.trim();
      const cleanSection = formData.section.trim().toUpperCase();

      const payload = {
        subjects: parsedSubjects,
        timetableConfig: timetableData
      };

      if (editingConfig) {
        await api.updateClassConfig(editingConfig._id, payload);
      } else {
        payload.standard = cleanStandard;
        payload.section = cleanSection;
        await api.addClassConfig(payload);
      }
      
      await refreshConfigs();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save configuration:', err);
      if (err.message && err.message.includes("already exists")) {
        alert("This class and section combination already exists in your configuration.");
      } else {
        alert(err.message || 'Error saving configuration');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this configuration? This might affect existing records.')) return;
    try {
      await api.deleteClassConfig(id);
      await refreshConfigs();
    } catch (err) {
      console.error('Failed to delete configuration:', err);
      alert('Error deleting configuration');
    }
  };

  const toggleDay = (day) => {
    const days = [...timetableData.workingDays];
    if (days.includes(day)) {
      setTimetableData({ ...timetableData, workingDays: days.filter(d => d !== day) });
    } else {
      setTimetableData({ ...timetableData, workingDays: [...days, day] });
    }
  };

  const updateFreq = (index, field, value) => {
    const newFreqs = [...timetableData.subjectFrequencies];
    newFreqs[index][field] = value;
    setTimetableData({ ...timetableData, subjectFrequencies: newFreqs });
  };

  if (loadingConfigs) {
    return <div className="text-gray-900 text-center p-8">Loading configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E1C40] dark:text-gray-900 drop-shadow-sm flex items-center">
          <Settings className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-adminSidebar shrink-0" />
          <span>Class & Subject Configuration</span>
        </h1>
        <NeonButton onClick={() => handleOpenModal()} className="bg-adminSidebar text-white text-[#2E1C40] w-full sm:w-auto shrink-0 whitespace-nowrap">
          <Plus className="w-5 h-5 mr-2 inline" /> Add Class/Section
        </NeonButton>
      </div>

      <GlassCard className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-[#D8FDF6]/40 dark:bg-white text-[#4C677C] dark:text-[#E5D9C4]">
            <tr className="border-b border-[#E5D9C4] dark:border-[#4C677C]/30 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold text-center rounded-tl-lg">Standard</th>
              <th className="p-4 font-bold text-center">Section</th>
              <th className="p-4 font-bold text-left">Subjects</th>
              <th className="p-4 font-bold text-center rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...classConfigs]
              .sort((a, b) => {
                const stdA = parseInt(a.standard, 10);
                const stdB = parseInt(b.standard, 10);
                if (stdA !== stdB) return stdA - stdB;
                return a.section.localeCompare(b.section);
              })
              .map((config) => (
              <tr key={config._id} className="border-b border-[#E5D9C4]/40 dark:border-[#4C677C]/30 hover:bg-[#D8FDF6]/20 dark:hover:bg-[#2E1C40]/20 transition-colors">
                <td className="p-4 font-medium text-center text-[#2E1C40] dark:text-gray-900">{config.standard}</td>
                <td className="p-4 font-medium text-center text-[#2E1C40] dark:text-gray-900">{config.section}</td>
                <td className="p-4 text-left text-[#4C677C] dark:text-gray-300">
                  <div className="flex flex-wrap gap-2">
                    {config.subjects.map(sub => (
                      <span key={sub} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {sub}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-center whitespace-nowrap">
                  <button onClick={() => handleOpenModal(config)} className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 mr-4 transition-colors" title="Edit Configuration">
                    <Edit2 className="w-5 h-5 inline" />
                  </button>
                  <button onClick={() => handleDelete(config._id)} className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete Configuration">
                    <Trash2 className="w-5 h-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {classConfigs.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  No class configurations found. Click "Add Class/Section" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-2xl p-6 my-8">
            <h2 className="text-xl font-bold text-[#2E1C40] dark:text-gray-900 mb-4">
              {editingConfig ? 'Edit Class Configuration' : 'Add Class & Section'}
            </h2>
            
            <div className="flex border-b border-gray-200 mb-6">
              <button 
                type="button"
                className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'general' ? 'border-adminSidebar text-adminSidebar' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('general')}
              >
                General Settings
              </button>
              <button 
                type="button"
                className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'timetable' ? 'border-adminSidebar text-adminSidebar' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('timetable')}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Timetable Settings
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {activeTab === 'general' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#4C677C] dark:text-gray-700 mb-1">Standard / Class</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingConfig} // Cannot change standard/section once created, only subjects
                        value={formData.standard}
                        onChange={e => setFormData({...formData, standard: e.target.value})}
                        placeholder="e.g. 11"
                        className="glass-input w-full dark:text-gray-900 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4C677C] dark:text-gray-700 mb-1">Section</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingConfig}
                        value={formData.section}
                        onChange={e => setFormData({...formData, section: e.target.value})}
                        placeholder="e.g. A"
                        className="glass-input w-full dark:text-gray-900 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#4C677C] dark:text-gray-700 mb-1">Subjects (Comma separated)</label>
                    <textarea
                      required
                      value={formData.subjects}
                      onChange={handleSubjectsChange}
                      placeholder="Tamil, English, Maths, Science"
                      className="glass-input w-full dark:text-gray-900 h-24"
                    />
                    <p className="text-xs text-gray-500 mt-1">Changes here will automatically populate subjects in Timetable Settings.</p>
                  </div>
                </>
              )}

              {activeTab === 'timetable' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-[#4C677C] dark:text-gray-700 mb-2">Working Days</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_DAYS.map(day => (
                        <label key={day} className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${timetableData.workingDays.includes(day) ? 'bg-adminSidebar text-white border-adminSidebar' : 'bg-white text-gray-600 border-gray-300'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={timetableData.workingDays.includes(day)}
                            onChange={() => toggleDay(day)}
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#4C677C] dark:text-gray-700 mb-2">Periods per Day</label>
                    <input 
                      type="number" 
                      min="1" max="12"
                      value={timetableData.periodsPerDay}
                      onChange={e => setTimetableData({...timetableData, periodsPerDay: parseInt(e.target.value) || 8})}
                      className="glass-input w-32 dark:text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#4C677C] dark:text-gray-700 mb-2">Subject Frequencies (Weekly Periods)</label>
                    {timetableData.subjectFrequencies.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No subjects added in General tab.</p>
                    ) : (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="p-2 pl-4 font-medium text-gray-700">Subject</th>
                              <th className="p-2 font-medium text-gray-700 w-32">Periods/Week</th>
                              <th className="p-2 font-medium text-gray-700 w-40">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {timetableData.subjectFrequencies.map((freq, idx) => (
                              <tr key={idx}>
                                <td className="p-2 pl-4 font-medium text-gray-900">{freq.subjectName}</td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    min="0" max="48"
                                    value={freq.weeklyPeriods}
                                    onChange={(e) => updateFreq(idx, 'weeklyPeriods', parseInt(e.target.value) || 0)}
                                    className="border border-gray-300 rounded p-1 w-full text-gray-900"
                                  />
                                </td>
                                <td className="p-2">
                                  <select 
                                    value={freq.type}
                                    onChange={(e) => updateFreq(idx, 'type', e.target.value)}
                                    className="border border-gray-300 rounded p-1 w-full text-gray-900"
                                  >
                                    <option value="subject">Subject</option>
                                    <option value="pt">PT</option>
                                    <option value="art">Art</option>
                                    <option value="activity">Activity</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <NeonButton type="submit" disabled={isSubmitting} className="bg-adminSidebar text-white text-[#2E1C40]">
                  {isSubmitting ? 'Saving...' : 'Save Configuration'}
                </NeonButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
