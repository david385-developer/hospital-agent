import React, { useState, useEffect } from 'react';
import { bedsAPI, patientsAPI } from '../../services/api';
import { TOAST_MESSAGES } from '../../utils/constants';
import toast from 'react-hot-toast';
import { 
  FiX, 
  FiBox, 
  FiUser, 
  FiCheckCircle, 
  FiCpu, 
  FiSearch,
  FiFileText
} from 'react-icons/fi';

export const BedModal = ({ bed, onClose, onSuccess, initialPatientId = null }) => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingPatients, setFetchingPatients] = useState(true);

  useEffect(() => {
    const fetchUnassignedPatients = async () => {
      try {
        const list = await patientsAPI.getAll();
        // Filter those without an assigned bed or mock defaults if empty
        if (list.length > 0) {
          setPatients(list.filter((patient) => !patient.assigned_bed_id));
        } else {
          setPatients([
            { id: 'P-1042', name: 'John Doe', symptoms: ['Severe Chest Pain', 'Shortness of Breath'], priority: 'HIGH', isAiRecommended: bed?.ward === 'ICU' },
            { id: 'P-1043', name: 'Maria Garcia', symptoms: ['High Fever', 'Severe Headache'], priority: 'MODERATE', isAiRecommended: bed?.ward === 'Emergency' },
            { id: 'P-1045', name: 'Anita Patel', symptoms: ['Abdominal Pain', 'Nausea'], priority: 'MODERATE', isAiRecommended: false }
          ]);
        }
      } catch (err) {
        setPatients([
          { id: 'P-1042', name: 'John Doe', symptoms: ['Severe Chest Pain', 'Shortness of Breath'], priority: 'HIGH', isAiRecommended: bed?.ward === 'ICU' },
          { id: 'P-1043', name: 'Maria Garcia', symptoms: ['High Fever', 'Severe Headache'], priority: 'MODERATE', isAiRecommended: bed?.ward === 'Emergency' },
          { id: 'P-1045', name: 'Anita Patel', symptoms: ['Abdominal Pain', 'Nausea'], priority: 'MODERATE', isAiRecommended: false }
        ]);
      } finally {
        setFetchingPatients(false);
      }
    };
    fetchUnassignedPatients();
  }, [bed]);

  const getEquipmentList = (ward) => {
    switch (ward) {
      case 'ICU':
        return 'Ventilator, Cardiac Monitor, Defibrillator, Continuous Oxygen Supply, IV Infusion Pumps';
      case 'Emergency':
        return 'Standard Telemetry Monitor, Suction Unit, Wall Oxygen, Emergency Crash Cart Access';
      case 'General':
      default:
        return 'Standard Hospital Bed, Bedside Call Button, Mobile IV Stand, Basic Vitals Monitor';
    }
  };

  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term);
  });

  const handleAssign = async () => {
    if (!selectedPatientId || !(bed?.id || bed?.bed_id)) return;
    setLoading(true);
    try {
      await bedsAPI.assign(bed.id || bed.bed_id, selectedPatientId);
      toast.success(TOAST_MESSAGES.BED_ASSIGNED);
      if (onSuccess) onSuccess();
      else if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || TOAST_MESSAGES.BED_ERROR);
    } finally {
      setLoading(false);
    }
  };

  if (!bed) return null;

  return (
    <div className="bg-[#1e293b] border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="p-6 bg-[#111827]/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold font-mono">
            <FiBox className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Assign Bed {bed.id || bed.bed_id}</h2>
            <p className="text-xs text-slate-400">Select an unassigned patient to allocate this bed</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto pr-2 scrollbar-hide">
        
        {/* Bed Details Summary Card */}
        <div className="p-4 rounded-xl bg-[#111827]/60 border border-slate-700/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ward Type:</span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {bed.ward || bed.ward_type} Ward
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status:</span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1">
                <FiCheckCircle className="w-3.5 h-3.5" />
                <span>Available</span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 block mb-1">Equipment Available in this Bed:</span>
            <p className="text-slate-400 italic leading-relaxed">{getEquipmentList(bed.ward || bed.ward_type)}</p>
          </div>
        </div>

        {/* Patient Selection Section */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Patient to Assign <span className="text-red-400">*</span>
          </label>

          {/* Search Input */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search unassigned patients by name or ID..."
              className="w-full bg-[#111827] text-slate-200 placeholder-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-700/80 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Patient List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {fetchingPatients ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading unassigned patients...</div>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((p) => {
                const isSelected = selectedPatientId === p.id;
                const isAiRec = p.isAiRecommended || ((bed.ward || bed.ward_type) === 'ICU' && p.priority === 'HIGH');

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`
                      p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3
                      ${isSelected 
                        ? 'bg-blue-500/20 border-blue-500 shadow-md shadow-blue-500/10' 
                        : 'bg-[#111827]/70 border-slate-700/60 hover:bg-slate-800/60'}
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-500'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{p.name}</span>
                          <span className="text-xs font-mono text-blue-400">({p.id})</span>
                          {isAiRec && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 shrink-0">
                              <FiCpu className="w-3 h-3" />
                              <span>AI Recommended</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {p.symptoms ? p.symptoms.join(', ') : 'No symptoms listed'}
                        </p>
                      </div>
                    </div>

                    {p.priority && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded shrink-0 ${
                        p.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {p.priority}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 bg-[#111827]/40 rounded-xl border border-slate-800">
                No unassigned patients found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Assignment Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FiFileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Assignment Notes & Special Equipment Instructions</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any specific nurse instructions, telemetry requirements, or equipment setup needs..."
            className="w-full bg-[#111827] text-slate-100 placeholder-slate-500 text-sm rounded-xl p-3.5 border border-slate-700/80 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

      </div>

      {/* Action Footer */}
      <div className="p-6 bg-[#111827]/90 border-t border-slate-700/60 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-700"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={!selectedPatientId || loading}
          onClick={handleAssign}
          className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Assigning Bed...</span>
            </>
          ) : (
            <span>Assign Patient to Bed</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default BedModal;
