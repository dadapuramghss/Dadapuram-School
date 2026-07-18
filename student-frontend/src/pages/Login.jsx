import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, ArrowRight, Loader2, User, Users } from 'lucide-react';

export default function Login() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresSelection, setRequiresSelection] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!mobileNumber) {
      setError('Please enter your mobile number');
      return;
    }

    setLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${baseURL}/student-portal/login`, {
        mobileNumber
      });
      
      if (response.data.requiresSelection) {
        setStudentsList(response.data.students);
        setRequiresSelection(true);
      } else if (response.data.token) {
        localStorage.setItem('studentToken', response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your number.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = async (studentId) => {
    setLoading(true);
    setError('');
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${baseURL}/student-portal/login-select`, {
        mobileNumber,
        studentId
      });
      if (response.data.token) {
        localStorage.setItem('studentToken', response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login as selected student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left transition-transform duration-500 scale-x-0 group-hover:scale-x-100"></div>
          
          {requiresSelection ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-inner">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Select Student</h2>
                <p className="text-gray-500 text-sm">Multiple students found for {mobileNumber}</p>
              </div>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {studentsList.map((student) => (
                  <button
                    key={student._id}
                    onClick={() => handleStudentSelect(student._id)}
                    disabled={loading}
                    className="w-full flex items-center p-4 bg-white/60 hover:bg-white/90 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all group text-left shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mr-4 group-hover:bg-indigo-100 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{student.name}</h3>
                      <p className="text-xs text-gray-500">Class {student.standard} - {student.section} | Roll: {student.rollNumber}</p>
                    </div>
                    {loading ? <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" /> : <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors transform group-hover:translate-x-1" />}
                  </button>
                ))}
              </div>
              
              {error && (
                <p className="text-red-500 text-sm mt-4 text-center animate-bounce">{error}</p>
              )}
              
              <button
                onClick={() => {
                  setRequiresSelection(false);
                  setStudentsList([]);
                  setError('');
                }}
                disabled={loading}
                className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-24 h-24 mb-2">
                  <img src="/student rise.png" alt="Student Rise Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Rise</h1>
                <p className="text-gray-500 text-sm">Sign in to view your academic progress</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700 block">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      id="mobileNumber"
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter your registered mobile number"
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-gray-400"
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 text-sm mt-2 animate-bounce">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Access Dashboard</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
          
          <div className="text-center text-xs text-gray-400 mt-6">
            EduPulse © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
