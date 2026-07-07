import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardAPI } from '../services/api';
import StatsCards from '../components/Dashboard/StatsCards';
import EmergencyAlerts from '../components/Dashboard/EmergencyAlerts';
import BedOverview from '../components/Dashboard/BedOverview';
import RecentActivity from '../components/Dashboard/RecentActivity';
import { motion } from 'framer-motion';
import { FiPlusCircle, FiUploadCloud, FiCpu } from 'react-icons/fi';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsData = await dashboardAPI.getStats();
        setStats(statsData || {});
      } catch (err) {
        // Fallback to default stats if API is unavailable during demo
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Top Section: Greeting & Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {getGreeting()}, {user?.name || 'Administrator'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is your hospital operations overview for <span className="text-slate-200 font-semibold">{getFormattedDate()}</span>
          </p>
        </div>

        {/* Quick Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/patients?action=create&emergency=true')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all duration-200"
          >
            <FiPlusCircle className="w-4 h-4" />
            <span>Add Emergency Patient</span>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700/80 hover:border-slate-600 transition-all duration-200 shadow-sm"
          >
            <FiUploadCloud className="w-4 h-4 text-slate-400" />
            <span>Upload Report</span>
          </button>

          <button
            onClick={() => navigate('/analysis')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/20 transition-all duration-200"
          >
            <FiCpu className="w-4 h-4" />
            <span>Run AI Analysis</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards Row */}
      <section>
        <StatsCards stats={stats} />
      </section>

      {/* Middle Section: Alerts (left wider) and Bed Overview (right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-7"
        >
          <EmergencyAlerts alerts={stats.alerts} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-5"
        >
          <BedOverview bedStats={stats.beds} />
        </motion.div>
      </section>

      {/* Bottom Section: Recent Activity Feed */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <RecentActivity activities={stats.recentActivity} />
      </motion.section>
    </div>
  );
};

export default DashboardPage;
