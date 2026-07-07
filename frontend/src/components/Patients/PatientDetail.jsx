import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STATUS_COLORS } from '../../utils/constants';
import { bedsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, 
  FiEdit2, 
  FiUser, 
  FiAlertCircle, 
  FiCpu, 
  FiFileText, 
  FiBox, 
  FiCheckCircle, 
  FiUploadCloud, 
  FiExternalLink,
  FiPlus
} from 'react-icons/fi';

export const PatientDetail = ({ patient = {}, onEdit, onRefresh }) => {
  const navigate = useNavigate();
  const [releasingBed, setReleasingBed] = useState(false);

  // Fallback defaults
  const p = {
    id: patient.id || 'P-1042',
    name: patient.name || 'John Doe',
    age: patient.age || 45,
    gender: patient.gender || 'Male',
    contact: patient.contact || '+1 (555) 234-5678',
    emergencyContact: patient.emergencyContact || 'Jane Doe (Wife) - +1 (555) 987-6543',
    status: patient.status || 'Admitted',
    symptoms: patient.symptoms || ['Severe Chest Pain', 'Shortness of Breath', 'Diaphoresis', 'Dizziness'],
    assignedBed: patient.assignedBed || 'ICU-103',
    wardType: patient.wardType || 'ICU',
    assignedDoctor: patient.assignedDoctor || 'Dr. Sarah Chen',
    admissionDate: patient.admissionDate || '2025-01-15 14:30',
    createdBy: patient.createdBy || 'Admin Staff',
    emergencyNotes: patient.emergencyNotes || 'Patient presented with acute coronary syndrome symptoms. Oxygen saturation dropped to 88% upon arrival. Immediate ECG performed showing ST elevation. Administered nitroglycerin and aspirin.',
    analyses: patient.analyses || [
      {
        id: 'ANA-8921',
        date: 'Jan 15, 2025 at 2:35 PM',
        severity: 'CRITICAL',
        priority: 'HIGH',
        recommendedBed: 'ICU-103',
        summary: 'Emergency Triage identified life-threatening ACS. High priority assigned.'
      }
    ],
    reports: patient.reports || [
      {
        id: 'REP-101',
        filename: 'patient_john_doe_blood_work.pdf',
        uploadDate: 'Jan 15, 2025 at 2:32 PM',
        uploadedBy: 'Nurse James',
        processed: true,
        url: '#'
      },
      {
        id: 'REP-102',
        filename: 'ecg_telemetry_scan_1430.pdf',
        uploadDate: 'Jan 15, 2025 at 2:34 PM',
        uploadedBy: 'Dr. Sarah Chen',
        processed: true,
        url: '#'
      }
    ]
  };

  const statusStyle = STATUS_COLORS[p.status] || 'bg-slate-700 text-slate-300';
  const hasBed = p.assignedBed && p.assignedBed !== 'Unassigned';

  const handleReleaseBed = async () => {
    if (!hasBed) return;
    if (!window.confirm(`Are you sure you want to release bed ${p.assignedBed} for patient ${p.name}?`)) return;

    setReleasingBed(true);
    try {
      await bedsAPI.release(p.assignedBed);
      toast.success(`Bed ${p.assignedBed} released successfully.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to release bed ${p.assignedBed}.`);
    } finally {
      setReleasingBed(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/patients')}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Back to Patients"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{p.name}</h1>
              <span className="font-mono font-bold text-sm text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                {p.id}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className={`px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm ${statusStyle}`}>
            {p.status}
          </span>

          <button
            onClick={onEdit || (() => navigate(`/patients?action=edit&id=${p.id}`))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <FiEdit2 className="w-4 h-4 text-blue-400" />
            <span>Edit Patient</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Wider - 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Personal Information */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 pb-3 border-b border-slate-700/50 mb-4">
              <FiUser className="w-4 h-4" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Full Name</span>
                <span className="font-semibold text-slate-100">{p.name}</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Age / Gender</span>
                <span className="font-semibold text-slate-100">{p.age} yrs / {p.gender}</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Contact Number</span>
                <span className="font-semibold text-slate-100">{p.contact || 'None specified'}</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Emergency Contact</span>
                <span className="font-semibold text-slate-100">{p.emergencyContact || 'None specified'}</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Admission Date</span>
                <span className="font-semibold text-slate-100">{p.admissionDate}</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Assigned Doctor</span>
                <span className="font-semibold text-blue-300">{p.assignedDoctor || 'Unassigned'}</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Assigned Bed</span>
                {hasBed ? (
                  <span className="font-mono font-bold text-green-400">{p.assignedBed} ({p.wardType})</span>
                ) : (
                  <span className="text-slate-500 italic">No bed assigned</span>
                )}
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Created By</span>
                <span className="font-semibold text-slate-300">{p.createdBy}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Medical Information */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-6 shadow-lg space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 pb-3 border-b border-slate-700/50">
              <FiAlertCircle className="w-4 h-4" />
              <span>Medical Information</span>
            </h3>

            {/* Symptoms */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Recorded Symptoms</h4>
              {p.symptoms && p.symptoms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {p.symptoms.map((symptom, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific symptoms recorded.</p>
              )}
            </div>

            {/* Emergency Notes */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>Emergency Triage Notes</span>
              </h4>
              {p.emergencyNotes ? (
                <div className="p-4 rounded-xl bg-[#991b1b]/10 border-2 border-red-500/40 text-slate-200 text-sm leading-relaxed font-sans">
                  {p.emergencyNotes}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-500 text-xs italic">
                  No emergency notes recorded.
                </div>
              )}
            </div>
          </div>

          {/* Card 3: AI Analysis History */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <FiCpu className="w-4 h-4" />
                <span>AI Analysis History</span>
              </h3>
              <button
                onClick={() => navigate(`/analysis/${p.id}`)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-colors"
              >
                + Run New Analysis
              </button>
            </div>

            {p.analyses && p.analyses.length > 0 ? (
              <div className="space-y-3">
                {p.analyses.map((ana) => (
                  <div
                    key={ana.id}
                    className="p-4 rounded-xl bg-[#111827]/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-purple-400">{ana.id}</span>
                        <span className="text-[11px] text-slate-400">{ana.date}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-semibold">
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          Severity: {ana.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          Priority: {ana.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 font-mono">
                          Bed: {ana.recommendedBed}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{ana.summary}</p>
                    </div>

                    <button
                      onClick={() => navigate(`/analysis/${p.id}`)}
                      className="self-start sm:self-center shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors"
                    >
                      View Full Analysis
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-[#111827]/50 rounded-xl border border-slate-800">
                <FiCpu className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300 mb-1">No AI analyses performed yet.</p>
                <p className="text-[11px] text-slate-500 mb-4">Run the multi-agent emergency workflow to get triage recommendations.</p>
                <button
                  onClick={() => navigate(`/analysis/${p.id}`)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-500/20 transition-all inline-flex items-center gap-1.5"
                >
                  <FiCpu className="w-4 h-4" />
                  <span>Run Analysis</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 4: Bed Assignment */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-400 flex items-center gap-2 pb-3 border-b border-slate-700/50 mb-4">
              <FiBox className="w-4 h-4" />
              <span>Bed Assignment</span>
            </h3>

            {hasBed ? (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-green-300 uppercase font-semibold">Current Assigned Bed</span>
                    <h4 className="text-2xl font-bold font-mono text-white mt-0.5">{p.assignedBed}</h4>
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-500 text-white shadow-sm">
                    {p.wardType} Ward
                  </span>
                </div>

                <div className="pt-2 border-t border-green-500/20 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Since:</span>
                    <span className="font-medium">{p.admissionDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-medium">2 days, 5 hours</span>
                  </div>
                </div>

                <button
                  onClick={handleReleaseBed}
                  disabled={releasingBed}
                  className="w-full mt-2 py-2 rounded-lg border-2 border-red-500/80 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition-colors"
                >
                  {releasingBed ? 'Releasing Bed...' : 'Release Bed'}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#111827]/70 border border-slate-700 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-300">No bed currently assigned</p>
                <p className="text-xs text-slate-500">Assign a bed from available hospital inventory or use AI recommendations.</p>
                
                <button
                  onClick={() => navigate(`/beds?assignPatient=${p.id}`)}
                  className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Assign Bed</span>
                </button>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-medium">
                  Quick availability: <span className="text-green-400">ICU: 2 available</span> | <span className="text-amber-400">Emergency: 5 available</span> | <span className="text-blue-400">General: 16 available</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 5: Medical Reports */}
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <FiFileText className="w-4 h-4" />
                <span>Medical Reports</span>
              </h3>
              <button
                onClick={() => navigate(`/reports?patientId=${p.id}`)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Upload New</span>
              </button>
            </div>

            {/* List of Reports */}
            {p.reports && p.reports.length > 0 ? (
              <div className="space-y-3 mb-5">
                {p.reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 rounded-xl bg-[#111827]/80 border border-slate-700 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 shrink-0 mt-0.5">
                        <FiFileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate" title={rep.filename}>
                          {rep.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span>{rep.uploadDate}</span>
                          <span>•</span>
                          <span>{rep.uploadedBy}</span>
                        </div>
                        {rep.processed && (
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-green-400">
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            <span>AI Processed & Indexed</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <a
                      href={rep.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { if (rep.url === '#') { e.preventDefault(); toast.success('Opening PDF preview...'); } }}
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors shrink-0"
                      title="View Report PDF"
                    >
                      <FiExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center bg-[#111827]/40 rounded-xl border border-slate-800 mb-5">
                <FiFileText className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-300">No reports uploaded yet.</p>
              </div>
            )}

            {/* Quick Upload Drop Zone */}
            <div
              onClick={() => navigate(`/reports?patientId=${p.id}`)}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 rounded-xl p-5 text-center cursor-pointer transition-all group"
            >
              <FiUploadCloud className="w-8 h-8 text-slate-500 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
              <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                Click to upload medical report PDF
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Supported format: PDF (Max size: 10MB)
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
