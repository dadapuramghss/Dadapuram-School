import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, User, LogOut, GraduationCap, BarChart3, FileText, Backpack, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { logout, dbUser } = useAuth();

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    { name: 'System Dashboard', path: '/admin', exact: true, icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', exact: false, icon: Users },
    { name: 'Students', path: '/admin/students', exact: false, icon: Backpack },
    { name: 'Gradebook', path: '/admin/gradebook', exact: false, icon: GraduationCap },
    { name: 'Leaderboard', path: '/admin/leaderboard', exact: false, icon: BarChart3 },
    { name: 'Certificates', path: '/admin/certificates', exact: false, icon: FileText },
  ];

  return (
    <div className="dark flex h-screen overflow-hidden bg-[#0B0F19] text-gray-100 font-sans relative z-10">
      
      {/* Mobile Topbar */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 bg-[#111827]/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center">
            <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            EduAdmin
          </h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-800 text-gray-300 rounded-lg"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-[#111827] m-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-gray-800 flex flex-col justify-between transition-all duration-300 z-50 shrink-0",
        "fixed md:relative h-[calc(100vh-2rem)]",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-[150%] md:translate-x-0 w-[5.5rem]"
      )}>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className={cn("p-6 flex items-center h-24", isSidebarOpen ? "justify-between" : "justify-center")}>
            {isSidebarOpen && (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                  <img src="/dpm_logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  EduAdmin
                </h1>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block p-2 rounded-xl hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
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
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] font-semibold" 
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 font-medium"
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

        <div className={cn("p-4 space-y-2 shrink-0 border-t border-gray-800/50", !isSidebarOpen && "flex flex-col items-center")}>
          <NavLink
            to="/admin/profile"
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-2xl transition-all duration-300 w-full",
                isSidebarOpen ? "gap-3 px-4 py-3.5" : "justify-center p-3.5 mx-auto w-12",
                isActive 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] font-semibold" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 font-medium"
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
              "flex items-center rounded-2xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 w-full font-medium",
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
      <main className="flex-1 overflow-y-auto p-4 md:pl-0 pt-20 md:pt-4 w-full bg-[#0B0F19]">
        <div className="h-full rounded-3xl w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
