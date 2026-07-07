import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmergencyCard from './EmergencyCard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiGrid, 
  FiList, 
  FiFilter,
  FiEye,
  FiActivity
} from 'react-icons/fi';

export const EmergencyQueue = ({ patients = [], onAssignBed, onTriage }) => {
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Priority');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const defaultQueue = [
    {
      id: 'P-1042',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      priority: 'HIGH',
      waitTime: '14m',
      waitMinutes: 14,
      symptoms: ['Severe Chest Pain', 'Shortness of Breath', 'Diaphoresis'],
      emergencyNotes: 'Patient presented with acute coronary syndrome symptoms. Immediate triage required.',
      assignedBed: 'Unassigned',
      aiRecommendation: 'ICU Bed Recommended',
      status: 'Admitted'
    },
    {
      id: 'P-1046',
      name: 'David Miller',
      age: 58,
      gender: 'Male',
      priority: 'HIGH',
      waitTime: '28m',
      waitMinutes: 28,
      symptoms: ['Loss of Consciousness', 'Rapid Heartbeat', 'Severe Bleeding'],
      emergencyNotes: 'Head trauma from vehicular accident. Vitals unstable.',
      assignedBed: 'Unassigned',
      aiRecommendation: 'ICU Bed (Ventilator Access)',
      status: 'Admitted'
    },
    {
      id: 'P-1047',
      name: 'Elena Rostova',
      age: 34,
      gender: 'Female',
      priority: 'HIGH',
      waitTime: '35m',
      waitMinutes: 35,
      symptoms: ['Difficulty Breathing', 'High Fever', 'Seizures'],
      emergencyNotes: 'Acute respiratory distress with febrile seizures.',
      assignedBed: 'ICU-104',
      aiRecommendation: 'ICU Isolation Bed',
      status: 'Under Review'
    },
    {
      id: 'P-1043',
      name: 'Maria Garcia',
      age: 62,
      gender: 'Female',
      priority: 'MODERATE',
      waitTime: '18m',
      waitMinutes: 18,
      symptoms: ['High Fever', 'Severe Headache', 'Neck Stiffness'],
      emergencyNotes: 'Suspected meningitis. Lumbar puncture pending.',
      assignedBed: 'EMERG-204',
      aiRecommendation: 'Emergency Ward Observation',
      status: 'Under Review'
    },
    {
      id: 'P-1048',
      name: 'Samuel Jackson',
      age: 41,
      gender: 'Male',
      priority: 'MODERATE',
      waitTime: '42m',
      waitMinutes: 42,
      symptoms: ['Abdominal Pain', 'Nausea', 'Vomiting'],
      emergencyNotes: 'Severe right lower quadrant pain. Possible appendicitis.',
      assignedBed: 'Unassigned',
      aiRecommendation: 'Emergency Ward Bed',
      status: 'Admitted'
    },
    {
      id: 'P-1049',
      name: 'Chloe Bennett',
      age: 25,
      gender: 'Female',
      priority: 'MODERATE',
      waitTime: '50m',
      waitMinutes: 50,
      symptoms: ['Dizziness', 'Severe Headache'],
      emergencyNotes: 'Persistent migraine with aura and vertigo.',
      assignedBed: 'Unassigned',
      aiRecommendation: 'General Observation Bed',
      status: 'Under Review'
    },
    {
      id: 'P-1050',
      name: 'Arthur Pendelton',
      age: 67,
      gender: 'Male',
      priority: 'LOW',
      waitTime: '1h 15m',
      waitMinutes: 75,
      symptoms: ['Mild Contusions'],
      emergencyNotes: 'Minor laceration on left forearm. Needs suturing.',
      assignedBed: 'Unassigned',
      aiRecommendation: 'Outpatient Triage',
      status: 'Discharged'
    }
  ];

  const displayList = patients.length > 0 ? patients : defaultQueue;

  const getCounts = () => {
    const total = displayList.length;
    const crit = displayList.filter(p => p.priority === 'HIGH' || p.priority === 'CRITICAL').length;
    const mod = displayList.filter(p => p.priority === 'MODERATE' || p.priority === 'MEDIUM').length;
    const low = displayList.filter(p => p.priority === 'LOW').length;
    return { total, crit, mod, low };
  };

  const counts = getCounts();

  const filteredQueue = displayList.filter(p => {
    if (priorityFilter === 'All') return true;
    if (priorityFilter === 'CRITICAL') return p.priority === 'HIGH' || p.priority === 'CRITICAL';
    if (priorityFilter === 'MODERATE') return p.priority === 'MODERATE' || p.priority === 'MEDIUM';
    if (priorityFilter === 'LOW') return p.priority === 'LOW';
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Priority') {
      const score = { 'CRITICAL': 3, 'HIGH': 3, 'MODERATE': 2, 'MEDIUM': 2, 'LOW': 1 };
      return (score[b.priority] || 1) - (score[a.priority] || 1);
    }
    if (sortBy === 'Wait Time') {
      return (b.waitMinutes || 0) - (a.waitMinutes || 0);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
            <FiAlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Emergency Triage Queue
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {counts.total} Total
              </span>
              {counts.crit > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse shadow-sm shadow-red-500">
                  {counts.crit} CRITICAL
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time patient prioritization and bed allocation powered by multi-agent AI telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/patients?action=create&emergency=true')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm shadow-lg shadow-red-600/30 transition-all shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Emergency Patient</span>
        </button>
      </div>

      {/* Filter, Sort & View Mode Toggle Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1e293b] p-4 rounded-xl border border-slate-700/60 shadow-md">
        
        {/* Priority Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPriorityFilter('All')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              priorityFilter === 'All'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            All Priorities ({counts.total})
          </button>

          <button
            onClick={() => setPriorityFilter('CRITICAL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              priorityFilter === 'CRITICAL'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span>CRITICAL ({counts.crit})</span>
          </button>

          <button
            onClick={() => setPriorityFilter('MODERATE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              priorityFilter === 'MODERATE'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>MODERATE ({counts.mod})</span>
          </button>

          <button
            onClick={() => setPriorityFilter('LOW')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              priorityFilter === 'LOW'
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span>LOW ({counts.low})</span>
          </button>
        </div>

        {/* Sort & View Mode Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch md:self-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#111827] text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700/80 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Priority">Priority (Highest First)</option>
              <option value="Wait Time">Wait Time (Longest)</option>
              <option value="Newest First">Newest First</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-[#111827] p-1 rounded-lg border border-slate-700/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Table View"
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Queue Content */}
      {filteredQueue.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredQueue.map((patient) => (
                <EmergencyCard
                  key={patient.id}
                  patient={patient}
                  onAssignBed={onAssignBed}
                  onTriage={onTriage}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Table View */
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#111827]/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Wait Time</th>
                    <th className="py-3.5 px-4">Patient Name</th>
                    <th className="py-3.5 px-4">Symptoms</th>
                    <th className="py-3.5 px-4">Assigned Bed</th>
                    <th className="py-3.5 px-4">AI Recommendation</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 text-sm">
                  {filteredQueue.map((patient) => {
                    const isCrit = patient.priority === 'HIGH' || patient.priority === 'CRITICAL';
                    const hasBed = patient.assignedBed && patient.assignedBed !== 'Unassigned';

                    return (
                      <tr
                        key={patient.id}
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="hover:bg-slate-700/50 cursor-pointer transition-colors group"
                      >
                        <td className="py-4 px-4 font-mono font-bold text-blue-400">{patient.id}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                            isCrit ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isCrit ? 'CRITICAL' : patient.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-300">{patient.waitTime || '14m'}</td>
                        <td className="py-4 px-4 font-bold text-white">{patient.name}</td>
                        <td className="py-4 px-4 text-slate-300 max-w-xs truncate" title={patient.symptoms?.join(', ')}>
                          {patient.symptoms ? patient.symptoms.join(', ') : 'N/A'}
                        </td>
                        <td className="py-4 px-4 font-mono font-medium">
                          {hasBed ? <span className="text-green-400">{patient.assignedBed}</span> : <span className="text-red-400 font-semibold">Unassigned</span>}
                        </td>
                        <td className="py-4 px-4 text-xs text-purple-300 font-medium">
                          {patient.aiRecommendation || 'ICU Bed Recommended'}
                        </td>
                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onTriage ? onTriage(patient) : navigate(`/analysis/${patient.id}`)}
                              className="px-2.5 py-1 text-xs font-bold rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
                            >
                              Triage
                            </button>
                            <button
                              onClick={() => onAssignBed ? onAssignBed(patient) : navigate(`/beds?assignPatient=${patient.id}`)}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                            >
                              Bed
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="py-16 flex flex-col items-center justify-center text-center bg-[#1e293b] rounded-xl border border-slate-700/60">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-4">
            <FiCheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Emergency Queue Empty</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            No patients currently awaiting emergency triage or bed assignment. All incoming emergency cases have been allocated.
          </p>
          <button
            onClick={() => navigate('/patients?action=create&emergency=true')}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-lg shadow-red-600/30 transition-all inline-flex items-center gap-1.5"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Emergency Patient</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default EmergencyQueue;
