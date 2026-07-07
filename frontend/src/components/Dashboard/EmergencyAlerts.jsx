import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiChevronRight } from 'react-icons/fi';

export const EmergencyAlerts = ({ alerts = [] }) => {
  const navigate = useNavigate();

  const defaultAlerts = [
    {
      id: 1,
      severity: 'CRITICAL',
      message: 'ICU occupancy at 95% capacity. Only 1 bed remaining.',
      timestamp: '2 min ago',
      actionLabel: 'Reassign Beds',
      actionPath: '/beds',
    },
    {
      id: 2,
      severity: 'CRITICAL',
      message: 'Emergency queue backlog: 4 patients waiting > 30 minutes.',
      timestamp: '15 min ago',
      actionLabel: 'View Queue',
      actionPath: '/emergency',
    },
    {
      id: 3,
      severity: 'WARNING',
      message: 'ICU occupancy at 82%. Monitor closely.',
      timestamp: '32 min ago',
      actionLabel: 'View Details',
      actionPath: '/beds',
    },
    {
      id: 4,
      severity: 'WARNING',
      message: 'Staff shortage detected in Emergency Ward for night shift.',
      timestamp: '1 hr ago',
      actionLabel: null,
    },
    {
      id: 5,
      severity: 'NORMAL',
      message: 'All departments operating within normal parameters.',
      timestamp: '2 hrs ago',
      actionLabel: null,
    },
  ];

  const activeAlerts = alerts.length > 0 ? alerts : defaultAlerts;
  const criticalOrWarningCount = activeAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING').length;

  const getAlertStyles = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          container: 'bg-[#991b1b]/20 border-l-4 border-l-red-500 border-y border-r border-red-500/30 shadow-md',
          icon: <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
          badge: 'bg-red-500 text-white animate-pulse',
          text: 'text-red-200 font-medium',
        };
      case 'WARNING':
        return {
          container: 'bg-[#92400e]/20 border-l-4 border-l-amber-500 border-y border-r border-amber-500/30',
          icon: <FiAlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          text: 'text-amber-100 font-medium',
        };
      case 'NORMAL':
      default:
        return {
          container: 'bg-[#166534]/20 border-l-4 border-l-green-500 border-y border-r border-green-500/30',
          icon: <FiCheckCircle className="w-5 h-5 text-green-400 shrink-0" />,
          badge: 'bg-green-500/20 text-green-300 border border-green-500/30',
          text: 'text-slate-200',
        };
    }
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl shadow-lg p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Operational Alerts
          </h3>
          {criticalOrWarningCount > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse shadow-sm shadow-red-500">
              {criticalOrWarningCount}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/emergency')}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <FiChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Alert Items */}
      {activeAlerts.length > 0 ? (
        <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[420px] pr-1 scrollbar-hide">
          {activeAlerts.map((alert) => {
            const styles = getAlertStyles(alert.severity);

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${styles.container}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {alert.severity === 'CRITICAL' ? (
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
                        {styles.icon}
                      </div>
                    ) : (
                      styles.icon
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${styles.badge}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm leading-relaxed ${styles.text}`}>
                      {alert.message}
                    </p>
                  </div>
                </div>

                {alert.actionLabel && (
                  <button
                    onClick={() => navigate(alert.actionPath || '/dashboard')}
                    className="self-end sm:self-center shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-200 border border-slate-600/80 transition-colors shadow-sm"
                  >
                    {alert.actionLabel}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-3.5">
            <FiCheckCircle className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">All Clear</h4>
          <p className="text-xs text-slate-400 max-w-xs">
            No operational alerts at this time. All departments are running smoothly.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmergencyAlerts;
