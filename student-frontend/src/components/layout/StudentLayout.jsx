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
  BookOpen,
  Bell,
  Megaphone,
  Calendar
} from 'lucide-react';

export default function StudentLayout() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [circularIds, setCircularIds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
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

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('studentToken');
      if (!token) return;
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const [circRes, hwRes] = await Promise.all([
          axios.get(`${baseURL}/student-portal/circulars`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${baseURL}/student-portal/homework`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const circulars = (circRes.data.data || []).map(c => ({
          ...c,
          notificationType: 'circular',
          dateField: new Date(c.createdAt || Date.now())
        }));

        const homework = (hwRes.data.data || []).map(h => ({
          ...h,
          notificationType: 'homework',
          dateField: new Date(h.createdAt || Date.now())
        }));

        const combined = [...circulars, ...homework].sort((a, b) => b.dateField - a.dateField);
        setNotifications(combined);
        
        const ids = combined.map(c => c._id);
        setCircularIds(ids);
        
        const readIds = JSON.parse(localStorage.getItem('studentReadCirculars') || '[]');
        const unread = combined.filter(c => !readIds.includes(c._id));
        setUnreadCount(unread.length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  const handleNotificationClick = () => {
    localStorage.setItem('studentReadCirculars', JSON.stringify(circularIds));
    setUnreadCount(0);
    setIsNotificationPanelOpen(true);
  };

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
            <img src="/student rise.png" alt="Student Rise Logo" className="w-8 h-8 mr-2 object-contain" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Student Rise
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
            <h1 className="text-xl font-bold text-gray-900 lg:hidden">Student Rise</h1>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={handleNotificationClick}
              className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>
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

      {/* Notification Panel Overlay */}
      {isNotificationPanelOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[60]"
          onClick={() => setIsNotificationPanelOpen(false)}
        />
      )}

      {/* Notification Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col ${
        isNotificationPanelOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            Notifications
          </h2>
          <button 
            onClick={() => setIsNotificationPanelOpen(false)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map(n => (
              <div 
                key={n._id} 
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-indigo-200"
                onClick={() => {
                  setIsNotificationPanelOpen(false);
                  navigate(n.notificationType === 'circular' ? '/dashboard' : '/homework');
                }}
              >
                {n.notificationType === 'circular' ? (
                  <div className="flex gap-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0 h-fit">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{n.title}</h4>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{n.description}</p>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        {n.postedBy || 'Admin'} • {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 h-fit">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                          {n.subject}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm">{n.title}</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{n.description}</p>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-red-500 uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(n.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
