import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { compressImage } from '../lib/utils';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

export function Students() {
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    standard: '6',
    section: 'A',
    gender: 'Other',
    medium: 'TAMIL',
    tamilName: '',
    fatherName: '',
    dob: '',
    admissionNumber: '',
    religion: '',
    community: '',
    address: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [studentsList, setStudentsList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { dbUser } = useAuth();

  let availableStandards = ['6', '7', '8', '9', '10', '11', '12'];
  let availableSections = ['A', 'B', 'C', 'D'];

  if (dbUser?.role !== 'admin' && dbUser?.assignedClasses?.length > 0) {
    availableStandards = [...new Set(dbUser.assignedClasses.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
    availableSections = dbUser.assignedClasses
      .filter(c => c.standard === formData.standard)
      .map(c => c.section)
      .sort();
  }

  const hasFullAccess = dbUser?.role === 'admin' || (
    dbUser?.assignedClasses?.find(c => c.standard === formData.standard && c.section === formData.section)?.accessLevel !== 'view'
  );

  useEffect(() => {
    if (availableStandards.length > 0 && !availableStandards.includes(formData.standard)) {
      setFormData(prev => ({ ...prev, standard: availableStandards[0] }));
    }
  }, [availableStandards, formData.standard]);

  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(formData.section)) {
      setFormData(prev => ({ ...prev, section: availableSections[0] }));
    }
  }, [availableSections, formData.section, formData.standard]);

  const fetchStudents = async () => {
    if (!formData.standard || !formData.section) return;
    setListLoading(true);
    try {
      const response = await api.getStudents(formData.standard, formData.section);
      setStudentsList(response.data || []);
    } catch (err) {
      console.error('Error fetching student list:', err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [formData.standard, formData.section]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(prev => ({
      ...prev,
      name: '', rollNumber: '', medium: 'TAMIL', gender: 'Other',
      tamilName: '', fatherName: '', dob: '', admissionNumber: '', religion: '', community: '', address: '', photoUrl: ''
    }));
    setFile(null);
    setMessage('');
    setIsFormOpen(true);
  };

  const handleEdit = (student) => {
    setEditingId(student._id);
    setFormData({
      name: student.name || '',
      rollNumber: student.rollNumber || '',
      standard: student.standard || formData.standard,
      section: student.section || formData.section,
      gender: student.gender || 'Other',
      medium: student.medium || 'TAMIL',
      tamilName: student.tamilName || '',
      fatherName: student.fatherName || '',
      dob: student.dob || '',
      admissionNumber: student.admissionNumber || '',
      religion: student.religion || '',
      community: student.community || '',
      address: student.address || '',
      photoUrl: student.photoUrl || '' 
    });
    setFile(null);
    setMessage('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      let photoUrl = formData.photoUrl || null; 
      
      if (file) {
        try {
          photoUrl = await compressImage(file, 1);
        } catch (err) {
          console.error("Compression failed, using original file", err);
          photoUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
      }

      const payload = {
        ...formData,
        photoUrl
      };

      if (editingId) {
        await api.updateStudent(editingId, payload);
      } else {
        await api.addStudent(payload);
      }
      
      fetchStudents();
      closeForm();
      
    } catch (err) {
      console.error(err);
      setMessage(`Error ${editingId ? 'updating' : 'adding'} student.`);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    
    try {
      await api.deleteStudent(id);
      fetchStudents();
    } catch (err) {
      console.error("Error deleting student:", err);
      alert("Failed to delete student.");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-black drop-shadow-sm dark:from-white dark:to-white/70">
          Student Management
        </h1>
      </div>

      {/* Class & Section Selectors (Always visible) */}
      <GlassCard className="flex flex-wrap gap-6 items-end dark:bg-[#111827] dark:border-gray-800 dark:shadow-none">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Class / Standard</label>
          <select 
            value={formData.standard}
            onChange={(e) => setFormData({...formData, standard: e.target.value})}
            className="glass-input w-full dark:!text-white [&>option]:bg-white dark:bg-[#0B0F19]"
            disabled={availableStandards.length === 0}
          >
            {availableStandards.map(std => (
              <option key={std} value={std}>Standard {std}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Section</label>
          <select 
            value={formData.section}
            onChange={(e) => setFormData({...formData, section: e.target.value})}
            className="glass-input w-full dark:!text-white [&>option]:bg-white dark:bg-[#0B0F19]"
            disabled={availableSections.length === 0}
          >
            {availableSections.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* STUDENT LIST */}
      <GlassCard className="dark:bg-[#111827] dark:border-gray-800 dark:shadow-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-indigo-900 dark:text-white">
            Students in {formData.standard}-{formData.section}
          </h2>
          {hasFullAccess && (
            <NeonButton onClick={openAddForm} className="py-2 px-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Student
            </NeonButton>
          )}
        </div>

        {listLoading ? (
          <p className="text-slate-400 dark:text-slate-400 dark:text-white/50 text-center py-8">Loading students...</p>
        ) : studentsList.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-400 dark:text-white/50 text-center py-8">No students found in this section.</p>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-gray-800/30 sticky top-0 backdrop-blur-md">
                <tr className="border-b border-gray-100 dark:border-gray-800 text-indigo-900 dark:text-purple-400 uppercase text-xs tracking-wider">
                  <th className="p-3 rounded-tl-lg font-medium">Roll No</th>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Medium</th>
                  {hasFullAccess && <th className="p-3 rounded-tr-lg font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {studentsList.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 text-slate-500 dark:text-gray-400">{s.rollNumber}</td>
                    <td className="p-3 font-medium text-slate-800 dark:text-gray-200">{s.name}</td>
                    <td className="p-3 text-slate-500 dark:text-gray-400">{s.medium}</td>
                    {hasFullAccess && (
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(s)}
                            className="p-2 text-primaryGlow hover:bg-primaryGlow/20 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(s._id)}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* MODAL OVERLAY FOR ADD/EDIT FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl my-auto">
            <GlassCard className="w-full max-h-[90vh] overflow-y-auto custom-scrollbar dark:bg-[#111827] dark:border-gray-800">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-[#111827] backdrop-blur-md py-2 border-b border-slate-100 dark:border-gray-800 z-10 -mx-6 px-6 -mt-6">
                <h2 className="text-xl font-bold text-indigo-900 dark:text-white">
                  {editingId ? 'Edit Student' : 'Add New Student'}
                </h2>
                <button onClick={closeForm} className="p-2 text-slate-400 dark:text-slate-400 dark:text-white/50 hover:text-slate-800 dark:text-slate-800 dark:text-white transition-colors rounded-full hover:bg-slate-100 dark:bg-slate-100 dark:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.includes('Error') ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 font-semibold">Class / Standard</label>
                    <select 
                      value={formData.standard}
                      onChange={(e) => setFormData({...formData, standard: e.target.value})}
                      className="glass-input w-full dark:!text-white [&>option]:bg-white dark:bg-[#0B0F19]"
                      disabled={availableStandards.length === 0}
                    >
                      {availableStandards.map(std => (
                        <option key={std} value={std}>Standard {std}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Section</label>
                    <select 
                      value={formData.section}
                      onChange={(e) => setFormData({...formData, section: e.target.value})}
                      className="glass-input w-full dark:!text-white [&>option]:bg-white dark:bg-[#0B0F19]"
                      disabled={availableSections.length === 0}
                    >
                      {availableSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Medium</label>
                    <select 
                      value={formData.medium}
                      onChange={(e) => setFormData({...formData, medium: e.target.value})}
                      className="glass-input w-full dark:!text-white [&>option]:bg-white dark:bg-[#0B0F19]"
                    >
                      <option value="TAMIL">TAMIL</option>
                      <option value="ENGLISH">ENGLISH</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="glass-input w-full dark:!text-white [&>option]:bg-white dark:bg-[#0B0F19]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Roll Number</label>
                    <input 
                      type="text" 
                      required
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                      className="glass-input w-full"
                      placeholder="e.g. 101"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="glass-input w-full"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Tamil Name</label>
                    <input 
                      type="text" 
                      value={formData.tamilName}
                      onChange={(e) => setFormData({...formData, tamilName: e.target.value})}
                      className="glass-input w-full"
                      placeholder="தமிழ் பெயர்"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Father's Name</label>
                    <input 
                      type="text" 
                      value={formData.fatherName}
                      onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                      className="glass-input w-full"
                      placeholder="Father's Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Date of Birth</label>
                    <input 
                      type="date" 
                      value={formData.dob}
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      className="glass-input w-full dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Admission Number</label>
                    <input 
                      type="text" 
                      value={formData.admissionNumber}
                      onChange={(e) => setFormData({...formData, admissionNumber: e.target.value})}
                      className="glass-input w-full"
                      placeholder="e.g. 1249"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Religion</label>
                    <input 
                      type="text" 
                      value={formData.religion}
                      onChange={(e) => setFormData({...formData, religion: e.target.value})}
                      className="glass-input w-full"
                      placeholder="e.g. Hindu"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Community</label>
                    <input 
                      type="text" 
                      value={formData.community}
                      onChange={(e) => setFormData({...formData, community: e.target.value})}
                      className="glass-input w-full"
                      placeholder="e.g. BC"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="glass-input w-full h-24 resize-none"
                    placeholder="Full Address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-indigo-900/80 font-semibold dark:text-white/80">Profile Photo</label>
                  {editingId && formData.photoUrl && (
                    <div className="mb-2">
                      <img src={formData.photoUrl} alt="Current" className="w-16 h-16 rounded-full object-cover border border-white/20" />
                      <p className="text-xs text-slate-400 dark:text-slate-400 dark:text-white/50 mt-1">Upload new to replace</p>
                    </div>
                  )}
                  {file && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Photo selected!</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <label className="flex-1 text-center cursor-pointer py-3 px-4 rounded-xl font-bold text-sm bg-indigo-100 text-indigo-700 dark:bg-white/10 dark:text-white hover:bg-indigo-200 dark:hover:bg-white/20 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      Take Photo
                    </label>
                    <label className="flex-1 text-center cursor-pointer py-3 px-4 rounded-xl font-bold text-sm bg-purple-100 text-purple-700 dark:bg-white/10 dark:text-white hover:bg-purple-200 dark:hover:bg-white/20 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      Upload Photo
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={closeForm}
                    className="flex-1 py-3 px-4 rounded-lg font-medium text-slate-500 dark:text-slate-500 dark:text-white/70 bg-slate-50 dark:bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-slate-100 dark:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <NeonButton type="submit" disabled={loading} className="flex-1">
                    {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Student' : 'Add Student')}
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
