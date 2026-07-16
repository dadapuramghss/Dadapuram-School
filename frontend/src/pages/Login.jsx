import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('teacher');
  const navigate = useNavigate();
  const { login, loginWithGoogle, logout, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await login(email, password);
      
      // Verify role against backend
      try {
        const dbUser = await api.get('/auth/me');
        if (dbUser.role !== selectedRole) {
          await logout();
          setError(`Access denied. You do not have ${selectedRole} privileges.`);
          // Note: AuthContext handles logging out if we want, but for now we just show an error.
          // Since AuthContext already sets currentUser, they are technically logged into Firebase,
          // but we can just show the error and not navigate.
          setLoading(false);
          return;
        }
      } catch (backendErr) {
        // If backend is down, we can't verify role. We'll proceed and let ProtectedRoute handle it.
      }
      
      navigate('/');
    } catch (err) {
      console.error("Login failed:", err.code, err.message);
      
      let errorMsg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/unverified-email') {
        errorMsg = err.message;
      } else if (err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect password.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please try again later.';
      } else if (err.message) {
        // Fallback to the exact Firebase error message if available
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const userCredential = await loginWithGoogle();
      
      // Verify role against backend
      try {
        const dbUser = await api.get('/auth/me');
        if (dbUser.role !== selectedRole) {
          await logout();
          setError(`Access denied. You do not have ${selectedRole} privileges.`);
          setLoading(false);
          return;
        }
      } catch (backendErr) {
        // proceed if backend is down
      }

      navigate('/');
    } catch (err) {
      setError('Failed to sign in with Google. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset your password.');
      return;
    }
    
    try {
      setError('');
      setMessage('');
      setResetting(true);
      await resetPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError('Failed to send reset email. ' + err.message);
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/60 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/40 rounded-full blur-[120px] pointer-events-none" />
      
      <GlassCard className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4">
            <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight text-white drop-shadow-md">
            Edu<span className="text-transparent bg-clip-text bg-gradient-to-r from-primaryGlow to-secondaryGlow">Pulse</span>
          </h1>
          <p className="text-white/60 text-sm">Academic Analytics & Ranking Dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        <div className="flex bg-white/5 p-1 rounded-xl mb-6">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedRole === 'teacher' 
                ? 'bg-primaryGlow text-slate-900 shadow-lg shadow-primaryGlow/25' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setSelectedRole('teacher')}
          >
            Login as Teacher
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedRole === 'admin' 
                ? 'bg-primary text-white shadow-lg shadow-primary/40' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setSelectedRole('admin')}
          >
            Login as Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full"
              placeholder="admin@school.edu"
              autoComplete="off"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-white/80">Password</label>
              <button 
                type="button" 
                onClick={handleResetPassword}
                disabled={resetting}
                className="text-xs text-primaryGlow hover:text-secondaryGlow transition-colors"
              >
                {resetting ? 'Sending...' : 'Forgot Password?'}
              </button>
            </div>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <NeonButton type="submit" disabled={loading} className="w-full">
            {loading ? 'Authenticating...' : 'Sign In'}
          </NeonButton>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="w-1/5 border-b border-white/10 lg:w-1/4"></span>
          <span className="text-xs text-center text-gray-400 uppercase">or</span>
          <span className="w-1/5 border-b border-white/10 lg:w-1/4"></span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </button>

        <div className="mt-8 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primaryGlow hover:text-secondaryGlow transition-colors font-medium">
            Register for access
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
