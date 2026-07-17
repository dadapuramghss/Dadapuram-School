import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, GraduationCap, LogOut, BarChart3, ShieldAlert, FileText, User, ChevronLeft, ChevronRight, Menu, X, Bot, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TeacherLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
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
    { name: 'Homework', path: '/teacher/homework', exact: false, icon: BookOpen },
    { name: 'Leaderboard', path: '/teacher/leaderboard', exact: false, icon: BarChart3 },
    { name: 'Certificates', path: '/teacher/certificates', exact: false, icon: FileText },
    { name: 'AI Analyst', path: '/teacher/ai', exact: false, icon: Bot },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F8F7] text-[#2E1C40] font-sans relative z-10">
      
      {/* Mobile Topbar */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 bg-[#2E1C40] border-b border-[#4C677C]/30 flex items-center justify-between px-4 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-[#D8FDF6] rounded-lg p-1">
            <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-[#E5D9C4] tracking-tight">
            Edu Teacher
          </h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-[#62D4CA] text-[#2E1C40] rounded-lg"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-[#2E1C40]/40 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-[#2E1C40] m-4 rounded-2xl shadow-xl border border-[#4C677C]/30 flex flex-col justify-between transition-all duration-300 z-50 shrink-0",
        "fixed md:relative h-[calc(100vh-2rem)]",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-[150%] md:translate-x-0 w-[5.5rem]"
      )}>
        <div>
          <div className={cn("p-6 flex items-center h-24", isSidebarOpen ? "justify-between" : "justify-center")}>
            {isSidebarOpen && (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#D8FDF6] rounded-xl p-1 shadow-sm">
                  <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold text-[#E5D9C4] tracking-tight">
                  Edu Teacher
                </h1>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block p-2 rounded-xl hover:bg-[#4C677C]/40 text-[#D8FDF6]/70 hover:text-[#D8FDF6] transition-colors"
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
                    "flex items-center rounded-xl transition-all duration-300",
                    isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mb-2 mx-auto w-12",
                    isActive 
                      ? "bg-[#62D4CA] text-[#2E1C40] shadow-md font-bold border-l-4 border-[#D8FDF6]" 
                      : "text-[#E5D9C4]/70 hover:bg-[#4C677C]/40 hover:text-[#E5D9C4] font-medium border-l-4 border-transparent"
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

        <div className={cn("p-4 space-y-2 border-t border-[#4C677C]/30", !isSidebarOpen && "flex flex-col items-center")}>
          <NavLink
            to="/teacher/profile"
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-xl transition-all duration-300 w-full",
                isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12",
                isActive 
                  ? "bg-[#62D4CA] text-[#2E1C40] shadow-md font-bold border-l-4 border-[#D8FDF6]" 
                  : "text-[#E5D9C4]/70 hover:bg-[#4C677C]/40 hover:text-[#E5D9C4] font-medium border-l-4 border-transparent"
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
              "flex items-center rounded-xl text-[#E5D9C4]/70 hover:bg-[#732A26] hover:text-[#E5D9C4] transition-all duration-300 w-full font-medium border border-transparent hover:border-[#AE634A]/50",
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
