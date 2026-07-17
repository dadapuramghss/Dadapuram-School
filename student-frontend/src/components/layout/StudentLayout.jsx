import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, 
  User, 
  Award, 
  LogOut, 
  Menu, 
  X, 
  BookOpen
} from 'lucide-react';

export default function StudentLayout() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      const token = localStorage.getItem('studentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${baseURL}/student-portal/me`, {
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

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Homework', path: '/homework', icon: BookOpen },
    { name: 'Marks', path: '/marks', icon: Award },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white">
            <BookOpen className="w-6 h-6 text-indigo-600 mr-2" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              EduPulse
            </span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="ml-auto lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                  {item.name}
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0 opacity-80 group-hover:opacity-100" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 lg:hidden rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 lg:hidden">Student Portal</h1>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-gray-900">{student.name}</span>
              <span className="text-xs font-medium text-gray-500">Std {student.standard} - {student.section}</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-indigo-100 overflow-hidden bg-indigo-50 flex items-center justify-center flex-shrink-0">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-indigo-300" />
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <Outlet context={{ student }} />
        </main>
      </div>
    </div>
  );
}
