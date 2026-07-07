import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PRIORITY_COLORS } from '../../utils/constants';
import { motion } from 'framer-motion';
import { 
  FiClock, 
  FiAlertCircle, 
  FiCpu, 
  FiBox, 
  FiEye, 
  FiPlus, 
  FiActivity 
} from 'react-icons/fi';

export const EmergencyCard = ({ patient, onAssignBed, onTriage }) => {
  const navigate = useNavigate();

  if (!patient) return null;

  const priority = patient.priority || (patient.status === 'Admitted' ? 'HIGH' : 'MODERATE');
  const isCritical = priority === 'HIGH' || priority === 'CRITICAL';
  
  const getCardStyle = (prio) => {
    switch (prio) {
      case 'HIGH':
      case 'CRITICAL':
        return {
          container: 'bg-[#991b1b]/15 border-l-4 border-l-red-500 border-y border-r border-red-500/40 shadow-lg shadow-red-500/10',
          badge: 'bg-red-500 text-white animate-pulse shadow-sm shadow-red-500/50',
          wait: 'text-red-400 font-bold',
        };
      case 'MODERATE':
      case 'MEDIUM':
        return {
          container: 'bg-[#92400e]/15 border-l-4 border-l-amber-500 border-y border-r border-amber-500/30',
          badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
          wait: 'text-amber-400 font-semibold',
        };
      case 'LOW':
      default:
        return {
          container: 'bg-[#166534]/15 border-l-4 border-l-green-500 border-y border-r border-green-500/30',
          badge: 'bg-green-500/20 text-green-300 border border-green-500/40',
          wait: 'text-slate-400',
        };
    }
  };

  const styles = getCardStyle(priority);
  const symptoms = patient.symptoms || ['Severe Chest Pain', 'Shortness of Breath'];
  const hasBed = patient.assignedBed && patient.assignedBed !== 'Unassigned';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className={`rounded-xl p-5 transition-all flex flex-col justify-between ${styles.container}`}
    >
      {/* Top Bar: ID, Priority Badge, Wait Time */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-blue-400 bg-[#111827]/80 px-2 py-0.5 rounded border border-slate-700">
            {patient.id || 'P-1042'}
          </span>
          <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${styles.badge}`}>
            {priority === 'HIGH' ? 'CRITICAL' : priority}
          </span>
        </div>

        <div className={`flex items-center gap-1 text-xs ${styles.wait}`}>
          <FiClock className="w-3.5 h-3.5" />
          <span>Wait: {patient.waitTime || '14m'}</span>
        </div>
      </div>

      {/* Patient Name & Age/Gender */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
          {patient.name || 'John Doe'}
        </h3>
        <p className="text-xs text-slate-300">
          {patient.age || 45} yrs / {patient.gender || 'Male'}
        </p>
      </div>

      {/* Symptoms Tag List */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5">
          {symptoms.slice(0, 3).map((sym, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#111827]/90 text-slate-200 border border-slate-700/80"
            >
              {sym}
            </span>
          ))}
          {symptoms.length > 3 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              +{symptoms.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Emergency Notes Snippet */}
      {patient.emergencyNotes && (
        <div className="mb-3 p-2.5 rounded-lg bg-[#111827]/60 border border-slate-700/50 text-xs text-slate-300 italic line-clamp-2">
          "{patient.emergencyNotes}"
        </div>
      )}

      {/* Status Indicators: Bed & AI Recommendation */}
      <div className="space-y-2 mb-4 pt-2 border-t border-slate-700/40 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Assigned Bed:</span>
          {hasBed ? (
            <span className="font-mono font-bold text-green-400 flex items-center gap-1">
              <FiBox className="w-3.5 h-3.5" />
              <span>{patient.assignedBed}</span>
            </span>
          ) : (
            <span className="font-semibold text-red-400 flex items-center gap-1">
              <FiAlertCircle className="w-3.5 h-3.5" />
              <span>Unassigned</span>
            </span>
          )}
        </div>

        {/* AI Recommendation Pill */}
        <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-between text-purple-300">
          <div className="flex items-center gap-1.5 font-semibold text-[11px]">
            <FiCpu className="w-3.5 h-3.5 shrink-0" />
            <span>AI: {patient.aiRecommendation || (isCritical ? 'ICU Bed Recommended' : 'Emergency Ward Bed')}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/40">
        <button
          onClick={() => onTriage ? onTriage(patient) : navigate(`/analysis/${patient.id}`)}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1"
        >
          <FiActivity className="w-3.5 h-3.5" />
          <span>Triage Now</span>
        </button>

        <button
          onClick={() => onAssignBed ? onAssignBed(patient) : navigate(`/beds?assignPatient=${patient.id}`)}
          className="w-full py-2 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1"
        >
          <FiPlus className="w-3.5 h-3.5" />
          <span>Assign Bed</span>
        </button>

        <button
          onClick={() => navigate(`/patients/${patient.id}`)}
          className="col-span-2 py-1.5 rounded-lg bg-[#111827]/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-colors flex items-center justify-center gap-1"
        >
          <FiEye className="w-3.5 h-3.5" />
          <span>View Full Clinical Record</span>
        </button>
      </div>
    </motion.div>
  );
};

export default EmergencyCard;
