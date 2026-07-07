import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBox, 
  FiUser, 
  FiPlus, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiTool,
  FiFilter,
  FiClock
} from 'react-icons/fi';

export const BedGrid = ({ beds = [], onAssignBed, onSelectBed }) => {
  const [activeWard, setActiveWard] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const generateDefaultBeds = () => {
    const list = [];
    // 10 ICU beds
    for (let i = 1; i <= 10; i++) {
      const id = `ICU-${100 + i}`;
      const isOccupied = i <= 8;
      list.push({
        id,
        ward: 'ICU',
        status: isOccupied ? 'Occupied' : 'Available',
        patientName: isOccupied ? `Patient #${1040 + i}` : null,
        patientId: isOccupied ? `P-${1040 + i}` : null,
        admissionTime: isOccupied ? 'Jan 15, 14:30' : null,
        severity: isOccupied ? (i <= 4 ? 'CRITICAL' : 'HIGH') : null,
      });
    }
    // 15 Emergency beds
    for (let i = 1; i <= 15; i++) {
      const id = `EMERG-${200 + i}`;
      const isOccupied = i <= 10;
      const isMaint = i === 15;
      list.push({
        id,
        ward: 'Emergency',
        status: isMaint ? 'Maintenance' : (isOccupied ? 'Occupied' : 'Available'),
        patientName: isOccupied ? `Patient #${2040 + i}` : null,
        patientId: isOccupied ? `P-${2040 + i}` : null,
        admissionTime: isOccupied ? 'Jan 15, 11:15' : null,
        severity: isOccupied ? 'MODERATE' : null,
      });
    }
    // 30 General beds
    for (let i = 1; i <= 30; i++) {
      const id = `GEN-${300 + i}`;
      const isOccupied = i <= 14;
      const isMaint = i === 29 || i === 30;
      list.push({
        id,
        ward: 'General',
        status: isMaint ? 'Maintenance' : (isOccupied ? 'Occupied' : 'Available'),
        patientName: isOccupied ? `Patient #${3040 + i}` : null,
        patientId: isOccupied ? `P-${3040 + i}` : null,
        admissionTime: isOccupied ? 'Jan 14, 09:00' : null,
        severity: isOccupied ? 'LOW' : null,
      });
    }
    return list;
  };

  const displayBeds = beds.length > 0 ? beds : generateDefaultBeds();

  const filteredBeds = displayBeds.filter(bed => {
    const matchesWard = activeWard === 'All' || bed.ward === activeWard;
    const matchesStatus = statusFilter === 'All' || bed.status === statusFilter;
    return matchesWard && matchesStatus;
  });

  const getWardCounts = () => {
    const icu = displayBeds.filter(b => b.ward === 'ICU').length;
    const emerg = displayBeds.filter(b => b.ward === 'Emergency').length;
    const gen = displayBeds.filter(b => b.ward === 'General').length;
    return { total: displayBeds.length, icu, emerg, gen };
  };

  const counts = getWardCounts();

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Occupied':
        return {
          card: 'bg-[#991b1b]/10 border-red-500/40 hover:border-red-500',
          badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
          dot: 'bg-red-500 animate-pulse',
        };
      case 'Maintenance':
        return {
          card: 'bg-[#92400e]/10 border-amber-500/40 hover:border-amber-500 opacity-80',
          badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'Available':
      default:
        return {
          card: 'bg-[#166534]/10 border-green-500/40 hover:border-green-500',
          badge: 'bg-green-500/20 text-green-300 border border-green-500/30',
          dot: 'bg-green-500',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Ward Tabs & Status Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1e293b] p-4 rounded-xl border border-slate-700/60 shadow-md">
        
        {/* Ward Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveWard('All')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeWard === 'All'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            All Wards ({counts.total})
          </button>

          <button
            onClick={() => setActiveWard('ICU')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeWard === 'ICU'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>ICU ({counts.icu})</span>
          </button>

          <button
            onClick={() => setActiveWard('Emergency')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeWard === 'Emergency'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Emergency ({counts.emerg})</span>
          </button>

          <button
            onClick={() => setActiveWard('General')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeWard === 'General'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span>General ({counts.gen})</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <FiFilter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111827] text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700/80 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
        <AnimatePresence>
          {filteredBeds.map((bed, index) => {
            const styles = getStatusStyles(bed.status);

            return (
              <motion.div
                key={bed.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => {
                  if (bed.status === 'Available' && onAssignBed) {
                    onAssignBed(bed);
                  } else if (onSelectBed) {
                    onSelectBed(bed);
                  }
                }}
                className={`
                  rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between min-h-[140px] shadow-sm relative group
                  ${styles.card}
                `}
              >
                {/* Top Row: ID & Status Dot */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="font-mono font-bold text-sm text-white tracking-tight">
                    {bed.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
                  </div>
                </div>

                {/* Ward Badge */}
                <div className="mb-auto">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#111827]/80 text-slate-300 border border-slate-700/60 inline-block">
                    {bed.ward}
                  </span>
                </div>

                {/* Bottom Section based on status */}
                <div className="pt-2 border-t border-slate-700/40 mt-2">
                  {bed.status === 'Occupied' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-200 text-xs font-semibold truncate" title={bed.patientName}>
                        <FiUser className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="truncate">{bed.patientName}</span>
                      </div>
                      {bed.admissionTime && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <FiClock className="w-3 h-3 shrink-0" />
                          <span>{bed.admissionTime}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {bed.status === 'Available' && (
                    <div className="flex flex-col justify-center items-center py-1">
                      <span className="text-xs font-bold text-green-400 mb-1">Available</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (onAssignBed) onAssignBed(bed); }}
                        className="w-full py-1 text-[10px] font-bold rounded bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 transition-colors flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100"
                      >
                        <FiPlus className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                    </div>
                  )}

                  {bed.status === 'Maintenance' && (
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium py-1">
                      <FiTool className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px]">Maintenance</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredBeds.length === 0 && (
        <div className="py-16 text-center bg-[#1e293b] rounded-xl border border-slate-700/60">
          <FiBox className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-300 mb-1">No beds match your filter</h4>
          <p className="text-xs text-slate-500">Try selecting "All Wards" or "All Statuses" to view inventory.</p>
        </div>
      )}
    </div>
  );
};

export default BedGrid;
