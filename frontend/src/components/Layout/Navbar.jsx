import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiMenu, FiSearch, FiBell } from 'react-icons/fi';

export const Navbar = ({ onOpenSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnread, setHasUnread] = useState(true);

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/patients')) return 'Patients';
    if (pathname.startsWith('/beds')) return 'Bed Management';
    if (pathname.startsWith('/emergency')) return 'Emergency Queue';
    if (pathname.startsWith('/reports')) return 'Medical Reports';
    if (pathname.startsWith('/analysis')) return 'AI Analysis';
    return 'Overview';
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 h-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-6 flex items-center justify-between transition-all duration-200 shadow-sm">
      {/* Left Side: Hamburger & Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Toggle Navigation"
        >
          <FiMenu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {currentTitle}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="text-blue-400 hover:underline cursor-pointer">MedOps AI</span>
            <span>&gt;</span>
            <span className="text-slate-300 capitalize">{currentTitle}</span>
          </div>
        </div>
      </div>

      {/* Right Side: Search, Bell, Avatar */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Search Bar */}
        <div className="relative hidden sm:block w-64 md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients, beds, reports..."
            className="w-full bg-[#1e293b]/90 text-slate-200 placeholder-slate-400 text-sm rounded-lg pl-10 pr-4 py-2 border border-slate-700/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
          />
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => setHasUnread(!hasUnread)}
          className="relative p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 border border-slate-700/50 transition-colors"
          title="Notifications"
        >
          <FiBell className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-slate-900 shadow-sm shadow-red-500" />
          )}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-700/60">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer hover:opacity-90 transition-opacity">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden xl:block">
            <p className="text-sm font-semibold text-slate-200 leading-tight">
              {user?.name || 'Authorized Staff'}
            </p>
            <p className="text-xs text-slate-400">
              {user?.role || 'Clinician'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
