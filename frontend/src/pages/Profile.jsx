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
      <h1 className="text-3xl font-bold bg-clip-text text-transparent text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-black drop-shadow-sm dark:from-white dark:to-white/70">
        My Profile
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Details Form */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 shadow-inner rounded-full">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-indigo-900">Account Details</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-indigo-900/80 dark:text-white/80 mb-1 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500 dark:text-white/50" />
                Display Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full font-bold text-indigo-900 bg-white shadow-sm border border-indigo-100 focus:ring-indigo-400"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-indigo-900/80 dark:text-white/80 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500 dark:text-white/50" />
                Email Address
              </label>
              <input 
                type="email" 
                value={dbUser.email}
                className="glass-input w-full opacity-60 font-bold text-indigo-900 bg-slate-50 border border-slate-200 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-slate-400 dark:text-white/40 mt-1 font-medium">Email cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-indigo-900/80 dark:text-white/80 mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500 dark:text-white/50" />
                Role
              </label>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  dbUser.role === 'admin' 
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30' 
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
                }`}>
                  {dbUser.role.toUpperCase()}
                </span>
                
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  dbUser.status === 'approved' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30' 
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30'
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

            <div className="pt-4 border-t border-slate-100 dark:border-white/10">
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
            <h2 className="text-xl font-bold text-indigo-900">Assigned Classes</h2>
          </div>

          {dbUser.role === 'admin' ? (
            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10 text-center">
              <p className="text-slate-500 dark:text-white/70">As an Admin, you have full access to all classes and sections.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dbUser.assignedClasses && dbUser.assignedClasses.length > 0 ? (
                dbUser.assignedClasses.map((ac, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-white/5 rounded-xl border border-indigo-100 dark:border-white/5 hover:bg-indigo-50 hover:shadow-sm transition-all">
                    <div>
                      <span className="font-bold text-indigo-950 dark:text-white">Standard {ac.standard}</span>
                      <span className="mx-2 text-indigo-200 dark:text-white/30">|</span>
                      <span className="text-indigo-800 font-bold dark:text-white/80">Section {ac.section}</span>
                    </div>
                    <div>
                      {ac.accessLevel === 'view' ? (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300">
                          View Only
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-green-500/20 dark:text-green-300">
                          Full Access
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                  <p className="text-slate-400 dark:text-white/50 font-medium italic">No classes assigned yet.</p>
                  <p className="text-xs text-slate-400/80 dark:text-white/40 mt-1 font-medium">Please contact an administrator.</p>
                </div>
              )}
            </div>
          )}
        </GlassCard>

      </div>
    </div>
  );
}
