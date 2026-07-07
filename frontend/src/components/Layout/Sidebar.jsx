import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS } from '../../utils/constants';
import { 
  FiGrid, 
  FiUsers, 
  FiBox, 
  FiAlertTriangle, 
  FiFileText, 
  FiCpu, 
  FiLogOut,
  FiX
} from 'react-icons/fi';
import { FaHospital } from 'react-icons/fa';
import { MdSmartToy } from 'react-icons/md';

const iconMap = {
  FiGrid: <FiGrid className="w-5 h-5" />,
  FiUsers: <FiUsers className="w-5 h-5" />,
  FiBox: <FiBox className="w-5 h-5" />,
  FiAlertTriangle: <FiAlertTriangle className="w-5 h-5" />,
  FiFileText: <FiFileText className="w-5 h-5" />,
  FiCpu: <FiCpu className="w-5 h-5" />,
  MdSmartToy: <MdSmartToy className="w-5 h-5" />
};

export const Sidebar = ({ isOpen, onClose, criticalCount = 2 }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'Doctor': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Nurse': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'Receptionist': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-[#111827] border-r border-slate-700/60
        flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        shadow-2xl lg:shadow-none
      `}>
        {/* Left Gradient Accent Line */}
        <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500" />

        {/* Top Section: Logo */}
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <FaHospital className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-wide leading-tight">
                MedOps AI
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Operations Center
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
          <div className="px-3 mb-2">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Main Menu
            </p>
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const isEmergency = item.label === 'Emergency Queue';

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                className={`
                  relative flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-500/20 text-blue-400 font-semibold shadow-inner' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'}
                `}
              >
                {/* Active Left Border Accent */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full" />
                )}

                <div className="flex items-center gap-3.5">
                  <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {iconMap[item.icon]}
                  </span>
                  <span>{item.label}</span>
                </div>

                {/* Critical Patient Badge for Emergency Queue */}
                {isEmergency && criticalCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40 flex items-center justify-center">
                    {criticalCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: User Info */}
        <div className="p-4 m-4 rounded-xl bg-[#1e293b]/70 border border-slate-700/50 backdrop-blur-sm flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-100 truncate">
                {user?.name || 'Authorized User'}
              </p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full ${getRoleBadgeColor(user?.role)}`}>
                {user?.role || 'Staff'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
