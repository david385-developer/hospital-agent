// frontend/src/pages/AIAnalysisPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { MdAutoAwesome, MdRefresh, MdHistory, MdPerson, MdArrowBack, MdErrorOutline } from 'react-icons/md';
import { patientsAPI, aiAPI } from '../services/api';
import WorkflowTimeline from '../components/AIAnalysis/WorkflowTimeline';
import AnalysisResult from '../components/AIAnalysis/AnalysisResult';
import { AGENT_INFO } from '../utils/constants';
import useAuth from '../hooks/useAuth';

const ALL_AGENT_KEYS = [
  'emergency_analysis',
  'report_analysis',
  'priority_classification',
  'bed_allocation',
  'risk_review',
  'coordination'
];

export default function AIAnalysisPage() {
  const { analysis_id: urlPatientId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const patientIdFromQuery = searchParams.get('patient');
  const initialPatientId = urlPatientId || patientIdFromQuery || '';

  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Workflow states
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // "idle" | "streaming" | "complete" | "error"
  const [agentResults, setAgentResults] = useState({});
  const [completedAgents, setCompletedAgents] = useState([]);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [totalDuration, setTotalDuration] = useState(null);
  const [activeAnalysisId, setActiveAnalysisId] = useState(null);

  const fetchPatients = async () => {
    try {
      const list = await patientsAPI.getAll();
      setPatients(list || []);
      return list || [];
    } catch (err) {
      console.error("Failed to fetch patients", err);
      toast.error("Failed to load patients list");
      return [];
    }
  };

  const fetchAnalyses = async () => {
    try {
      const list = await aiAPI.getAllAnalyses();
      setRecentAnalyses(list || []);
    } catch (err) {
      console.error("Failed to fetch recent analyses", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const list = await fetchPatients();
      await fetchAnalyses();
      setLoading(false);

      if (initialPatientId && list.length > 0) {
        const found = list.find(p => (p.patient_id || p.id) === initialPatientId);
        if (found) {
          setSelectedPatient(found);
          setSelectedPatientId(initialPatientId);
        }
      }
    };
    init();
  }, [initialPatientId]);

  const handlePatientSelect = (e) => {
    const id = e.target.value;
    setSelectedPatientId(id);
    if (id) {
      const found = patients.find(p => (p.patient_id || p.id) === id);
      setSelectedPatient(found || null);
      navigate(`/analysis/${id}`);
    } else {
      setSelectedPatient(null);
      navigate('/analysis');
    }
  };

  const handleAnalyze = () => {
    if (!selectedPatientId) {
      toast.error("Please select a patient first");
      return;
    }

    setAnalysisStatus("streaming");
    setAgentResults({});
    setCompletedAgents([]);
    setCurrentAgent(null);
    setTotalDuration(null);
    setActiveAnalysisId(null);

    toast.success("AI Crew initialized. Starting real-time SSE stream...");

    aiAPI.analyzeEmergencyStream(
      selectedPatientId,
      // onMessage
      (data) => {
        if (data.type === "agent_start") {
          setCurrentAgent(data.agent_key);
        } else if (data.type === "agent_complete") {
          setAgentResults(prev => ({ ...prev, [data.agent_key]: data.result }));
          setCompletedAgents(prev => {
            if (!prev.includes(data.agent_key)) {
              return [...prev, data.agent_key];
            }
            return prev;
          });
          setCurrentAgent(null);
        } else if (data.type === "agent_error") {
          setAgentResults(prev => ({ ...prev, [data.agent_key]: { error: data.error } }));
          setCompletedAgents(prev => {
            if (!prev.includes(data.agent_key)) {
              return [...prev, data.agent_key];
            }
            return prev;
          });
          setCurrentAgent(null);
          toast.error(`Agent ${data.agent_name || data.agent_key} encountered an issue`);
        } else if (data.type === "complete") {
          if (data.total_duration) setTotalDuration(data.total_duration);
          if (data.analysis_id) setActiveAnalysisId(data.analysis_id);
        }
      },
      // onError
      (err) => {
        console.error("SSE stream error:", err);
        setAnalysisStatus("error");
        setCurrentAgent(null);
        toast.error("Real-time streaming failed or disconnected. Please try again.");
      },
      // onComplete
      () => {
        setAnalysisStatus("complete");
        setCurrentAgent(null);
        toast.success("All 6 clinical agents completed analysis!");
        fetchAnalyses();
      }
    );
  };

  const handleViewPastAnalysis = (item) => {
    const patId = item.patientId || item.patient_id;
    if (patId) {
      setSelectedPatientId(patId);
      const found = patients.find(p => (p.patient_id || p.id) === patId);
      if (found) setSelectedPatient(found);
      navigate(`/analysis/${patId}`);
    }
    
    const resultsObj = {
      emergency_analysis: item.emergency_analysis || {},
      report_analysis: item.report_analysis || {},
      priority_classification: item.priority_classification || {},
      bed_allocation: item.bed_allocation || {},
      risk_review: item.risk_review || {},
      coordination: item.coordination || {}
    };
    
    setAgentResults(resultsObj);
    setCompletedAgents(ALL_AGENT_KEYS);
    setCurrentAgent(null);
    setTotalDuration(item.totalDuration || item.total_duration || 0);
    setActiveAnalysisId(item.analysis_id || item.id);
    setAnalysisStatus("complete");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetToIdle = () => {
    setAnalysisStatus("idle");
    setAgentResults({});
    setCompletedAgents([]);
    setCurrentAgent(null);
    setTotalDuration(null);
    setActiveAnalysisId(null);
  };

  const constructedAnalysis = {
    analysis_id: activeAnalysisId || "ANL-LIVE",
    patient_id: selectedPatient?.patient_id || selectedPatient?.id || selectedPatientId,
    patient_name: selectedPatient?.name || "Selected Patient",
    created_at: new Date().toISOString(),
    total_duration: totalDuration || 0,
    emergency_analysis: agentResults.emergency_analysis || {},
    report_analysis: agentResults.report_analysis || {},
    priority_classification: agentResults.priority_classification || {},
    bed_allocation: agentResults.bed_allocation || {},
    risk_review: agentResults.risk_review || {},
    coordination: agentResults.coordination || {},
    agent_results: agentResults
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6 md:p-8 space-y-8 rounded-2xl">
      <AnimatePresence mode="wait">
        {analysisStatus === "idle" ? (
          <motion.div
            key="idle-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 max-w-6xl mx-auto"
          >
            {/* Header */}
            <div className="text-center space-y-3 pt-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold uppercase tracking-wider">
                <MdAutoAwesome className="text-purple-400" /> CrewAI Real-Time Orchestration
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                AI Multi-Agent Analysis
              </h1>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                Our 6 autonomous clinical agents collaborate sequentially using CrewAI. Each agent queries MongoDB and ChromaDB vector embeddings in real-time, streaming Server-Sent Events directly to your console.
              </p>
            </div>

            {/* Command Control Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <MdPerson className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Select Patient Registry</h2>
                    <p className="text-xs text-slate-400">Choose a hospital patient to trigger multi-agent evaluation</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Patient Profile
                  </label>
                  {loading ? (
                    <div className="h-12 rounded-lg bg-slate-900/60 border border-slate-700 flex items-center px-4 text-slate-500 text-sm animate-pulse">
                      Loading patient registry...
                    </div>
                  ) : (
                    <select
                      value={selectedPatientId}
                      onChange={handlePatientSelect}
                      className="w-full h-12 rounded-lg bg-slate-900 border border-slate-700 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                    >
                      <option value="">-- Select a Registered Patient --</option>
                      {patients.map((pat) => (
                        <option key={pat.patient_id || pat.id} value={pat.patient_id || pat.id}>
                          {pat.name} • ID: {pat.patient_id || pat.id} • {pat.age}y/o • Priority: {pat.priority || 'Normal'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <button
                    onClick={handleAnalyze}
                    disabled={!selectedPatientId || loading}
                    className="w-full h-12 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <MdAutoAwesome className="text-lg" />
                    <span>Start Analysis</span>
                  </button>
                </div>
              </div>

              {selectedPatient && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs"
                >
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block mb-1">Age / Gender</span>
                    <span className="font-semibold text-white">{selectedPatient.age} yrs • {selectedPatient.gender}</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block mb-1">Current Ward / Bed</span>
                    <span className="font-mono font-semibold text-purple-400">{selectedPatient.assigned_bed_id || selectedPatient.assignedBed || 'Unassigned'}</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block mb-1">Current Status</span>
                    <span className="font-semibold text-amber-400">{selectedPatient.status || 'Under Review'}</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 block mb-1">Recorded Symptoms</span>
                    <span className="font-semibold text-white truncate block" title={Array.isArray(selectedPatient.symptoms) ? selectedPatient.symptoms.join(', ') : 'None'}>
                      {Array.isArray(selectedPatient.symptoms) ? selectedPatient.symptoms.join(', ') : 'None recorded'}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Recent Analyses List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MdHistory className="text-purple-400 text-xl" />
                  Recent AI Analyses
                </h3>
                <span className="text-xs text-slate-400 font-mono">Total Runs: {recentAnalyses.length}</span>
              </div>

              {recentAnalyses.length === 0 ? (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-sm">
                  No AI analyses recorded yet. Select a patient above and start an orchestration run.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentAnalyses.slice(0, 6).map((item, idx) => {
                    const sev = item.emergency_analysis?.severity_level || item.emergency_analysis?.severity || item.risk_review?.risk_level || 'NORMAL';
                    const badgeBg = sev === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    sev === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                    'bg-green-500/20 text-green-400 border-green-500/30';
                    return (
                      <motion.div
                        key={item.analysis_id || idx}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => handleViewPastAnalysis(item)}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-purple-500/50 transition-all shadow-md flex flex-col justify-between gap-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors text-sm">
                              {item.patient_name || item.patientName || `Patient ${item.patient_id}`}
                            </h4>
                            <p className="text-xs font-mono text-slate-400 mt-0.5">
                              ID: {item.patient_id || item.patientId}
                            </p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg}`}>
                            {sev}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-700/60">
                          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</span>
                          <span className="font-mono text-purple-400 font-semibold">{item.total_duration ? `${item.total_duration.toFixed(1)}s` : 'Done'}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="stream-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 max-w-6xl mx-auto"
          >
            {/* Top Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleResetToIdle}
                  className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <MdArrowBack />
                  <span>Command Center</span>
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Patient ID: <span className="font-mono text-purple-400">{selectedPatientId}</span></span>
                    {selectedPatient?.name && <span className="text-slate-400 font-normal">({selectedPatient.name})</span>}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {analysisStatus === "streaming" ? "Live CrewAI SSE Stream in Progress..." :
                     analysisStatus === "complete" ? "All 6 CrewAI Agents Executed Successfully" :
                     "Workflow Stopped with Exception"}
                  </p>
                </div>
              </div>

              {analysisStatus !== "streaming" && (
                <button
                  onClick={handleAnalyze}
                  className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all self-start sm:self-center"
                >
                  <MdRefresh className="text-base" />
                  <span>Re-run Analysis</span>
                </button>
              )}
            </div>

            {/* Workflow Timeline Component */}
            <WorkflowTimeline
              agentResults={agentResults}
              completedAgents={completedAgents}
              currentAgent={currentAgent}
              status={analysisStatus}
              totalDuration={totalDuration}
            />

            {/* Error Message Notice if stream failed */}
            {analysisStatus === "error" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center space-y-2">
                <MdErrorOutline className="text-red-400 text-3xl mx-auto" />
                <h3 className="text-red-400 font-bold text-base">Real-Time Streaming Interrupted</h3>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  The Server-Sent Events stream encountered a network disconnect or backend error. You can click "Re-run Analysis" above to retry.
                </p>
              </div>
            )}

            {/* Full Analysis Result display when complete */}
            {analysisStatus === "complete" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <AnalysisResult
                  analysis={constructedAnalysis}
                  patient={selectedPatient}
                  onRerun={handleAnalyze}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
