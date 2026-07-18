import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { compressImage } from '../lib/utils';
import { Trash2, Plus, Calendar, BookOpen, Camera, Upload, Mic, Square, Play, Image as ImageIcon } from 'lucide-react';

const subjects = ['Tamil', 'English', 'Math', 'Science', 'Social Science'];

export function Homework() {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    subject: subjects[0],
    dueDate: new Date().toISOString().split('T')[0]
  });

  // Media state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const { dbUser } = useAuth();
  
  let availableStandards = [];
  let availableSections = [];

  if (dbUser?.role === 'admin') {
    availableStandards = ['6', '7', '8', '9', '10', '11', '12'];
    availableSections = ['A', 'B', 'C', 'D'];
  } else if (dbUser?.assignedClasses) {
    availableStandards = [...new Set(dbUser.assignedClasses.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
    availableSections = dbUser.assignedClasses
      .filter(c => c.standard === selectedClass)
      .map(c => c.section)
      .sort();
  }

  const isClassSelected = selectedClass !== 'All' && selectedSection !== 'All';

  const hasFullAccess = isClassSelected && (
    dbUser?.role === 'admin' || (
      dbUser?.assignedClasses?.find(c => c.standard === selectedClass && c.section === selectedSection)?.accessLevel !== 'view'
    )
  );

  useEffect(() => {
    if (availableStandards.length > 0 && !availableStandards.includes(selectedClass)) {
      setSelectedClass(availableStandards[0]);
    }
  }, [availableStandards, selectedClass]);

  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(selectedSection)) {
      setSelectedSection(availableSections[0]);
    }
  }, [availableSections, selectedSection, selectedClass]);

  const loadHomework = async () => {
    if (!isClassSelected) return;
    try {
      setLoading(true);
      const res = await api.getHomeworkByClass(selectedClass, selectedSection);
      setHomeworkList(res.data || []);
    } catch (err) {
      console.error('Failed to load homework', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isClassSelected) {
      loadHomework();
    } else {
      setHomeworkList([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSection]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      
      // Auto stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
          stopRecording();
        }
      }, 60000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access the microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };
  
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let photoUrl = null;
      let voiceUrl = null;
      
      if (file) {
        photoUrl = await compressImage(file, 0.5); // Use 0.5 quality for better text readability
      }
      
      if (audioBlob) {
        voiceUrl = await blobToBase64(audioBlob);
      }

      await api.addHomework({
        ...newHomework,
        standard: selectedClass,
        section: selectedSection,
        photoUrl,
        voiceUrl
      });
      
      setIsAdding(false);
      resetForm();
      loadHomework();
    } catch (err) {
      console.error('Failed to add homework', err);
      alert('Error adding homework.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setNewHomework({
      title: '',
      description: '',
      subject: subjects[0],
      dueDate: new Date().toISOString().split('T')[0]
    });
    setFile(null);
    setPreviewUrl(null);
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this homework?')) return;
    try {
      await api.deleteHomework(id);
      loadHomework();
    } catch (err) {
      console.error('Failed to delete homework', err);
      alert('Error deleting homework.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-[#2E1C40] dark:text-white drop-shadow-sm flex items-start md:items-center">
          <BookOpen className="w-8 h-8 mr-3 text-[#62D4CA] shrink-0 mt-1 md:mt-0" />
          <span>Homework Management</span>
        </h1>
        {hasFullAccess && !isAdding && (
          <NeonButton onClick={() => setIsAdding(true)} className="bg-[#62D4CA] text-[#2E1C40] flex items-center self-start md:self-auto shrink-0">
            <Plus className="w-5 h-5 mr-2" />
            Add Homework
          </NeonButton>
        )}
      </div>

      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 space-y-2 w-full md:w-auto">
            <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4]">Class</label>
            <select 
              value={selectedClass} 
              onChange={e => {
                setSelectedClass(e.target.value);
                if (e.target.value === 'All') setSelectedSection('All');
              }}
              className="glass-input w-full font-bold text-[#2E1C40] dark:!text-white bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-[#62D4CA] [&>option]:bg-white dark:[&>option]:bg-[#131E3A]"
            >
              <option value="All">Select Class</option>
              {availableStandards.map(std => (
                <option key={std} value={std}>Standard {std}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-2 w-full md:w-auto">
            <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4]">Section</label>
            <select 
              value={selectedSection} 
              onChange={e => setSelectedSection(e.target.value)}
              className="glass-input w-full font-bold text-[#2E1C40] dark:!text-white bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-[#62D4CA] [&>option]:bg-white dark:[&>option]:bg-[#131E3A]"
              disabled={selectedClass === 'All'}
            >
              <option value="All">Select Section</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {isAdding && (
        <GlassCard className="border border-[#62D4CA] shadow-[0_0_15px_rgba(98,212,202,0.3)]">
          <h2 className="text-xl font-bold text-[#2E1C40] dark:text-white mb-4">Assign New Homework</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Title</label>
                <input 
                  type="text"
                  required
                  value={newHomework.title}
                  onChange={e => setNewHomework({...newHomework, title: e.target.value})}
                  className="glass-input w-full dark:text-white"
                  placeholder="e.g. Chapter 4 Exercise"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Subject</label>
                <select 
                  required
                  value={newHomework.subject}
                  onChange={e => setNewHomework({...newHomework, subject: e.target.value})}
                  className="glass-input w-full dark:text-white [&>option]:bg-white dark:[&>option]:bg-[#131E3A]"
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Description (Optional)</label>
                <textarea 
                  value={newHomework.description}
                  onChange={e => setNewHomework({...newHomework, description: e.target.value})}
                  className="glass-input w-full dark:text-white h-24"
                  placeholder="Instructions for the students..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Due Date</label>
                <input 
                  type="date"
                  required
                  value={newHomework.dueDate}
                  onChange={e => setNewHomework({...newHomework, dueDate: e.target.value})}
                  className="glass-input w-full dark:text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E5D9C4]/40 dark:border-[#4C677C]/30 mt-4">
              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Attach Photo (Optional)</label>
                {previewUrl && (
                  <div className="relative mb-2 inline-block">
                    <img src={previewUrl} alt="Preview" className="h-24 w-auto rounded-lg border border-[#E5D9C4] shadow-sm object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { setFile(null); setPreviewUrl(null); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center cursor-pointer py-2 px-3 rounded-xl font-bold text-sm bg-[#62D4CA]/20 text-[#2E1C40] hover:bg-[#62D4CA]/40 dark:text-white dark:hover:bg-[#62D4CA]/40 transition-colors">
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                    <Camera className="w-4 h-4 mr-2" /> Take Photo
                  </label>
                  <label className="flex-1 flex items-center justify-center cursor-pointer py-2 px-3 rounded-xl font-bold text-sm bg-[#2E1C40]/10 text-[#2E1C40] hover:bg-[#2E1C40]/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition-colors">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <Upload className="w-4 h-4 mr-2" /> Upload
                  </label>
                </div>
              </div>
              
              {/* Voice Message */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Voice Instructions (Optional)</label>
                {audioUrl && (
                  <div className="flex items-center gap-2 mb-2 bg-[#F2FCFA] dark:bg-[#1A1A24] p-2 rounded-lg border border-[#E5D9C4] dark:border-[#4C677C]/30">
                    <audio src={audioUrl} controls className="h-8 w-full max-w-[200px]" />
                    <button 
                      type="button" 
                      onClick={() => { setAudioBlob(null); setAudioUrl(null); }}
                      className="text-red-500 hover:text-red-600 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {!isRecording && !audioUrl && (
                  <button 
                    type="button"
                    onClick={startRecording}
                    className="w-full flex items-center justify-center py-2 px-3 rounded-xl font-bold text-sm bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 transition-colors border border-red-200 dark:border-red-900/50"
                  >
                    <Mic className="w-4 h-4 mr-2" /> Record Voice Message
                  </button>
                )}
                
                {isRecording && (
                  <button 
                    type="button"
                    onClick={stopRecording}
                    className="w-full flex items-center justify-center py-2 px-3 rounded-xl font-bold text-sm bg-red-500 text-white shadow-lg animate-pulse hover:bg-red-600 transition-colors"
                  >
                    <Square className="w-4 h-4 mr-2 fill-current" /> Stop Recording (Max 60s)
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4">
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); resetForm(); }}
                className="px-4 py-2 font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <NeonButton type="submit" disabled={loading} className="bg-[#62D4CA] text-[#2E1C40]">
                {loading ? 'Assigning...' : 'Assign Homework'}
              </NeonButton>
            </div>
          </form>
        </GlassCard>
      )}

      {!isClassSelected ? (
        <div className="text-center py-12 text-[#4C677C] dark:text-[#E5D9C4]/60">
          Select a class and section to view homework
        </div>
      ) : loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : homeworkList.length === 0 ? (
        <div className="text-center py-12 text-[#4C677C] dark:text-[#E5D9C4]/60 bg-white/30 dark:bg-[#1A1A24]/30 rounded-xl">
          <BookOpen className="w-12 h-12 mx-auto opacity-50 mb-3" />
          <p>No homework assigned for this class yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeworkList.map(hw => (
            <GlassCard key={hw._id} className="flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#62D4CA]"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="bg-[#62D4CA]/20 text-[#2E1C40] dark:text-[#62D4CA] px-3 py-1 rounded-full text-xs font-bold">
                  {hw.subject}
                </span>
                {hasFullAccess && (
                  <button 
                    onClick={() => handleDelete(hw._id)}
                    className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 bg-white/80 dark:bg-black/50 p-1 rounded-md"
                    title="Delete Homework"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="text-xl font-bold text-[#2E1C40] dark:text-white mb-2">{hw.title}</h3>
              {hw.description && (
                <p className="text-[#4C677C] dark:text-gray-300 text-sm mb-4 flex-1">
                  {hw.description}
                </p>
              )}
              
              {/* Media Preview in Card */}
              {(hw.photoUrl || hw.voiceUrl) && (
                <div className="mb-4 space-y-2 bg-[#F2FCFA]/50 dark:bg-[#131E3A]/50 p-3 rounded-xl border border-[#E5D9C4]/40 dark:border-[#4C677C]/30">
                  {hw.photoUrl && (
                    <div className="flex items-center text-sm text-[#4C677C] dark:text-[#E5D9C4] font-medium mb-1">
                      <ImageIcon className="w-4 h-4 mr-2 text-[#62D4CA]" />
                      Attached Photo
                    </div>
                  )}
                  {hw.voiceUrl && (
                    <div>
                      <div className="flex items-center text-sm text-[#4C677C] dark:text-[#E5D9C4] font-medium mb-2">
                        <Mic className="w-4 h-4 mr-2 text-red-400" />
                        Voice Instructions
                      </div>
                      <audio src={hw.voiceUrl} controls className="h-8 w-full" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-auto pt-4 border-t border-[#E5D9C4]/40 dark:border-[#4C677C]/30 flex items-center text-sm text-[#4C677C] dark:text-[#E5D9C4]/80">
                <Calendar className="w-4 h-4 mr-2" />
                Due: {new Date(hw.dueDate).toLocaleDateString()}
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-[#4C677C]/60 dark:text-[#E5D9C4]/50">
                  Assigned by: {hw.assignedBy}
                </div>
                <div className="text-[10px] text-[#4C677C]/40 dark:text-[#E5D9C4]/30">
                  Auto-deletes in 48h
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
