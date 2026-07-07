import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiBox, FiAlertTriangle, FiCpu } from 'react-icons/fi';

export const StatsCards = ({ stats = {} }) => {
  const navigate = useNavigate();

  // Dynamic values or defaults
  const totalPatients = stats.totalPatients !== undefined ? stats.totalPatients : 24;
  const newAdmissions = stats.newAdmissions !== undefined ? stats.newAdmissions : 3;
  const occupiedBeds = stats.occupiedBeds !== undefined ? stats.occupiedBeds : 32;
  const totalBeds = stats.totalBeds !== undefined ? stats.totalBeds : 55;
  const emergencyQueueCount = stats.emergencyQueueCount !== undefined ? stats.emergencyQueueCount : 7;
  const criticalCases = stats.criticalCases !== undefined ? stats.criticalCases : 3;
  const aiAnalysesToday = stats.aiAnalysesToday !== undefined ? stats.aiAnalysesToday : 12;
  const avgProcessingTime = stats.avgProcessingTime || '14.2s';

  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100) || 58;
  const availableBeds = totalBeds - occupiedBeds;

  const getOccupancyColor = (rate) => {
    if (rate > 85) return 'bg-red-500';
    if (rate >= 70) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const cards = [
    {
      id: 'patients',
      label: 'Total Patients',
      value: totalPatients,
      subtext: newAdmissions > 0 ? `+${newAdmissions} admitted today` : 'No new admissions',
      subtextClass: newAdmissions > 0 ? 'text-green-400 font-medium' : 'text-slate-400',
      icon: <FiUsers className="w-6 h-6 text-blue-400" />,
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      borderAccent: 'border-l-blue-500',
      path: '/patients',
    },
    {
      id: 'beds',
      label: 'Bed Occupancy',
      value: `${occupiedBeds}/${totalBeds}`,
      subtext: `${availableBeds} beds available`,
      subtextClass: 'text-slate-400',
      icon: <FiBox className="w-6 h-6 text-green-400" />,
      iconBg: 'bg-green-500/10 border-green-500/20',
      borderAccent: 'border-l-green-500',
      path: '/beds',
      progress: {
        rate: occupancyRate,
        color: getOccupancyColor(occupancyRate),
      },
    },
    {
      id: 'emergency',
      label: 'Emergency Queue',
      value: emergencyQueueCount,
      subtext: criticalCases > 0 ? `${criticalCases} critical cases` : 'No critical cases',
      subtextClass: criticalCases > 0 ? 'text-red-400 font-semibold' : 'text-slate-400',
      icon: <FiAlertTriangle className="w-6 h-6 text-amber-400" />,
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      borderAccent: 'border-l-amber-500',
      path: '/emergency',
      hasPulsingDot: criticalCases > 0,
    },
    {
      id: 'ai',
      label: 'AI Analyses Today',
      value: aiAnalysesToday,
      subtext: `Avg processing: ${avgProcessingTime}`,
      subtextClass: 'text-purple-300 font-medium',
      icon: <FiCpu className="w-6 h-6 text-purple-400" />,
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      borderAccent: 'border-l-purple-500',
      path: '/analysis',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate(card.path)}
          className={`
            bg-[#1e293b] border border-slate-700/60 border-l-4 ${card.borderAccent}
            rounded-xl p-6 shadow-lg cursor-pointer transition-all duration-200
            hover:shadow-xl hover:bg-[#334155]/60 relative overflow-hidden group
          `}
        >
          {/* Top Row: Label & Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
                {card.label}
              </span>
              {card.hasPulsingDot && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-slate-900 shadow-sm shadow-red-500" />
              )}
            </div>
            <div className={`p-2.5 rounded-xl border ${card.iconBg} shrink-0 group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
          </div>

          {/* Middle Row: Value */}
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-mono">
              {card.value}
            </h3>
            {card.progress && (
              <span className="text-xs font-semibold text-slate-300">
                {card.progress.rate}%
              </span>
            )}
          </div>

          {/* Progress Bar (for Bed Occupancy) */}
          {card.progress && (
            <div className="w-full h-1.5 bg-slate-700/80 rounded-full overflow-hidden mb-2.5">
              <div
                className={`h-full transition-all duration-500 rounded-full ${card.progress.color}`}
                style={{ width: `${Math.min(100, card.progress.rate)}%` }}
              />
            </div>
          )}

          {/* Bottom Row: Subtext */}
          <p className={`text-xs ${card.subtextClass}`}>
            {card.subtext}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
