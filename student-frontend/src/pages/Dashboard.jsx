import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, User, BookOpen, Award, MapPin } from 'lucide-react';

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      const token = localStorage.getItem('studentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/student-portal/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudent(response.data);
      } catch (error) {
        console.error('Error fetching student data:', error);
        localStorage.removeItem('studentToken');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                EduPulse Student
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Profile Card */}
        <div className="glass-card p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-indigo-50 flex-shrink-0 flex items-center justify-center">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-indigo-300" />
              )}
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
              {student.tamilName && <p className="text-lg text-gray-600 font-medium">{student.tamilName}</p>}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="bg-white/50 rounded-xl p-3 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Standard</p>
                  <p className="text-lg font-bold text-indigo-600">{student.standard} - {student.section}</p>
                </div>
                <div className="bg-white/50 rounded-xl p-3 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Roll No</p>
                  <p className="text-lg font-bold text-gray-800">{student.rollNumber}</p>
                </div>
                <div className="bg-white/50 rounded-xl p-3 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Medium</p>
                  <p className="text-lg font-bold text-gray-800">{student.medium}</p>
                </div>
                <div className="bg-white/50 rounded-xl p-3 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Gender</p>
                  <p className="text-lg font-bold text-gray-800">{student.gender}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details and Marks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Details */}
          <div className="space-y-8">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-500" />
                Personal Details
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Father's Name</span>
                  <span className="font-medium text-gray-900 text-sm">{student.fatherName || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Date of Birth</span>
                  <span className="font-medium text-gray-900 text-sm">{student.dob || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Admission No</span>
                  <span className="font-medium text-gray-900 text-sm">{student.admissionNumber || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Community</span>
                  <span className="font-medium text-gray-900 text-sm">{student.community || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Religion</span>
                  <span className="font-medium text-gray-900 text-sm">{student.religion || '-'}</span>
                </div>
                {student.address && (
                  <div className="pt-2">
                    <span className="text-gray-500 text-sm flex items-center mb-1">
                      <MapPin className="w-4 h-4 mr-1" /> Address
                    </span>
                    <p className="font-medium text-gray-900 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {student.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Academic Performance */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Award className="w-5 h-5 mr-2 text-amber-500" />
                Academic Performance
              </h2>
              
              {student.terms && student.terms.length > 0 ? (
                <div className="space-y-8">
                  {student.terms.map((term, index) => {
                    const totalScore = term.marks.reduce((acc, curr) => acc + curr.score, 0);
                    const maxScore = term.marks.length * 100;
                    const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={index} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                          <h3 className="font-bold text-indigo-900 text-lg">{term.termName} Exam</h3>
                          <div className="text-right">
                            <span className="text-sm text-indigo-600 font-semibold mr-3">
                              Total: {totalScore} / {maxScore}
                            </span>
                            <span className="inline-block bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {term.marks.map((mark, i) => (
                              <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1 truncate w-full text-center" title={mark.subject}>
                                  {mark.subject}
                                </span>
                                <span className={`text-2xl font-bold ${mark.score >= 35 ? 'text-gray-900' : 'text-red-500'}`}>
                                  {mark.score}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No academic records found yet.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
