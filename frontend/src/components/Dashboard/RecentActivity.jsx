import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUserPlus, FiBox, FiCpu, FiFileText, FiFile, FiChevronRight } from 'react-icons/fi';

export const RecentActivity = ({ activities = [] }) => {
  const navigate = useNavigate();

  const defaultActivities = [
    {
      id: 1,
      type: 'admission',
      text: 'Dr. Sarah Chen admitted patient John Doe (Emergency)',
      timestamp: '5 minutes ago',
      user: 'by Dr. Chen',
      icon: <FiUserPlus className="w-4 h-4 text-blue-400" />,
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      path: '/patients',
    },
    {
      id: 2,
      type: 'bed',
      text: 'Bed ICU-103 assigned to patient Maria Garcia',
      timestamp: '18 minutes ago',
      user: 'by Bed Coordinator',
      icon: <FiBox className="w-4 h-4 text-green-400" />,
      iconBg: 'bg-green-500/10 border-green-500/20',
      path: '/beds',
    },
    {
      id: 3,
      type: 'analysis',
      text: 'AI Analysis completed for patient #P-1042 - Priority: HIGH',
      timestamp: '25 minutes ago',
      user: 'by AI Supervisor',
      icon: <FiCpu className="w-4 h-4 text-purple-400" />,
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      path: '/analysis',
    },
    {
      id: 4,
      type: 'report',
      text: 'Medical report uploaded for patient Robert Wilson',
      timestamp: '1 hour ago',
      user: 'by Nurse James',
      icon: <FiFileText className="w-4 h-4 text-amber-400" />,
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      path: '/reports',
    },
    {
      id: 5,
      type: 'bed_release',
      text: 'Bed GEN-315 released and marked as available',
      timestamp: '2 hours ago',
      user: 'by Nurse James',
      icon: <FiBox className="w-4 h-4 text-green-400" />,
      iconBg: 'bg-green-500/10 border-green-500/20',
      path: '/beds',
    },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl shadow-lg p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-4">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Recent Activity
        </h3>
        <button
          onClick={() => navigate('/reports')}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <FiChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Activity List */}
      {displayActivities.length > 0 ? (
        <div className="divide-y divide-slate-700/40">
          {displayActivities.map((item) => (
            <div
              key={item.id}
              onClick={() => item.path && navigate(item.path)}
              className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3.5 group cursor-pointer hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
            >
              {/* Icon */}
              <div className={`p-2.5 rounded-xl border ${item.iconBg || 'bg-slate-800 border-slate-700'} shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                {item.icon || <FiFile className="w-4 h-4 text-slate-400" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium leading-snug group-hover:text-white transition-colors">
                  {item.text}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                  <span>{item.timestamp}</span>
                  <span>•</span>
                  <span className="text-slate-500 italic">{item.user}</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 shrink-0">
                <FiChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
            <FiFile className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-300 mb-1">No recent activity</h4>
          <p className="text-xs text-slate-500 max-w-xs">
            Activity will appear here as operations are performed across the hospital platform.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
