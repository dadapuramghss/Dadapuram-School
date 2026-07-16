import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { User, Mail, Shield, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export function Profile() {
  const { dbUser } = useAuth();
  
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (dbUser) {
      setName(dbUser.name || '');
    }
  }, [dbUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await api.updateProfile({ name });
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      // Note: In a full app, we might want to refresh dbUser in AuthContext here, 
      // but a reload or next login will pick it up anyway.
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!dbUser) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-[#2E1C40] font-black drop-shadow-sm  ">
        My Profile
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Details Form */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 shadow-inner rounded-full">
              <User className="w-6 h-6 text-[#62D4CA]" />
            </div>
            <h2 className="text-xl font-bold text-[#2E1C40]">Account Details</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#4C677C]  mb-1 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500 " />
                Display Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full font-bold text-[#2E1C40] bg-white shadow-sm border border-[#E5D9C4] focus:ring-indigo-400"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4C677C]  mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500 " />
                Email Address
              </label>
              <input 
                type="email" 
                value={dbUser.email}
                className="glass-input w-full opacity-60 font-bold text-[#2E1C40] bg-[#F2FCFA] border border-slate-200 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-[#4C677C]/60  mt-1 font-medium">Email cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4C677C]  mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500 " />
                Role
              </label>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  dbUser.role === 'admin' 
                    ? 'bg-purple-50 text-[#2E1C40] border-purple-200   ' 
                    : 'bg-blue-50 text-blue-700 border-blue-200   '
                }`}>
                  {dbUser.role.toUpperCase()}
                </span>
                
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  dbUser.status === 'approved' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200   ' 
                    : 'bg-amber-50 text-amber-700 border-amber-200   '
                }`}>
                  {dbUser.status.toUpperCase()}
                </span>
              </div>
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </div>
            )}

            <div className="pt-4 border-t border-[#E5D9C4] ">
              <NeonButton type="submit" disabled={isSaving || !name.trim()}>
                {isSaving ? 'Saving...' : 'Update Profile'}
              </NeonButton>
            </div>
          </form>
        </GlassCard>

        {/* Assigned Classes */}
        <GlassCard className="p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-sky-100 to-sky-50 shadow-inner rounded-full">
              <BookOpen className="w-6 h-6 text-sky-600" />
            </div>
            <h2 className="text-xl font-bold text-[#2E1C40]">Assigned Classes</h2>
          </div>

          {dbUser.role === 'admin' ? (
            <div className="bg-[#F2FCFA]  p-4 rounded-xl border border-[#E5D9C4]  text-center">
              <p className="text-[#4C677C] ">As an Admin, you have full access to all classes and sections.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dbUser.assignedClasses && dbUser.assignedClasses.length > 0 ? (
                dbUser.assignedClasses.map((ac, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#D8FDF6]/40/50  rounded-xl border border-[#E5D9C4]  hover:bg-[#D8FDF6]/40 hover:shadow-sm transition-all">
                    <div>
                      <span className="font-bold text-indigo-950 ">Standard {ac.standard}</span>
                      <span className="mx-2 text-indigo-200 ">|</span>
                      <span className="text-indigo-800 font-bold ">Section {ac.section}</span>
                    </div>
                    <div>
                      {ac.accessLevel === 'view' ? (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200  ">
                          View Only
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200  ">
                          Full Access
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 bg-[#F2FCFA]  rounded-2xl border border-[#E5D9C4] ">
                  <p className="text-[#4C677C]/60  font-medium italic">No classes assigned yet.</p>
                  <p className="text-xs text-[#4C677C]/60/80  mt-1 font-medium">Please contact an administrator.</p>
                </div>
              )}
            </div>
          )}
        </GlassCard>

      </div>
    </div>
  );
}
