import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, GraduationCap, LogOut, BarChart3, ShieldAlert, FileText, User, ChevronLeft, ChevronRight, Menu, X, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TeacherLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { logout, dbUser } = useAuth();

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/teacher', exact: true, icon: LayoutDashboard },
    { name: 'Students', path: '/teacher/students', exact: false, icon: Users },
    { name: 'Gradebook', path: '/teacher/gradebook', exact: false, icon: GraduationCap },
    { name: 'Leaderboard', path: '/teacher/leaderboard', exact: false, icon: BarChart3 },
    { name: 'Certificates', path: '/teacher/certificates', exact: false, icon: FileText },
    { name: 'AI Analyst', path: '/teacher/ai', exact: false, icon: Bot },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-purple-50 text-slate-800 font-sans relative z-10">
      
      {/* Mobile Topbar */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center">
            <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
            EduPulse
          </h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-indigo-900/20 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-white m-4 rounded-3xl shadow-[0_8px_30px_rgba(99,102,241,0.08)] border border-indigo-50/50 flex flex-col justify-between transition-all duration-300 z-50",
        "fixed md:relative h-[calc(100vh-2rem)]",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-[150%] md:translate-x-0 w-[5.5rem]"
      )}>
        <div>
          <div className={cn("p-6 flex items-center h-24", isSidebarOpen ? "justify-between" : "justify-center")}>
            {isSidebarOpen && (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                  <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                  EduPulse
                </h1>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
          
          <nav className="mt-2 px-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-2xl transition-all duration-300",
                    isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mb-2 mx-auto w-12",
                    isActive 
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.3)] font-semibold" 
                      : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                  )
                }
                title={!isSidebarOpen ? item.name : undefined}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", !isSidebarOpen && "md:mx-auto")} />
                {isSidebarOpen ? (
                  <span className="whitespace-nowrap overflow-hidden">{item.name}</span>
                ) : (
                  <span className="md:hidden whitespace-nowrap overflow-hidden ml-3">{item.name}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={cn("p-4 space-y-2", !isSidebarOpen && "flex flex-col items-center")}>
          <NavLink
            to="/teacher/profile"
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-2xl transition-all duration-300 w-full",
                isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12",
                isActive 
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.3)] font-semibold" 
                  : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
              )
            }
            title={!isSidebarOpen ? "My Profile" : undefined}
          >
            <User className={cn("w-5 h-5 flex-shrink-0", !isSidebarOpen && "md:mx-auto")} />
            {isSidebarOpen ? (
              <span className="whitespace-nowrap overflow-hidden">My Profile</span>
            ) : (
              <span className="md:hidden whitespace-nowrap overflow-hidden ml-3">My Profile</span>
            )}
          </NavLink>
          <button 
            onClick={logout}
            className={cn(
              "flex items-center rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 w-full font-medium",
              isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12"
            )}
            title={!isSidebarOpen ? "Logout" : undefined}
          >
            <LogOut className={cn("w-5 h-5 flex-shrink-0", !isSidebarOpen && "md:mx-auto")} />
            {isSidebarOpen ? (
              <span className="whitespace-nowrap overflow-hidden">Logout</span>
            ) : (
              <span className="md:hidden whitespace-nowrap overflow-hidden ml-3">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:pl-0 pt-20 md:pt-4 w-full">
        <div className="h-full rounded-3xl w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
