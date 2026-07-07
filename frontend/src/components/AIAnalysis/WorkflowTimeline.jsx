// frontend/src/components/AIAnalysis/WorkflowTimeline.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENT_INFO } from "../../utils/constants";
import {
  MdCheckCircle,
  MdHourglassEmpty,
  MdLocalHospital,
  MdDescription,
  MdFormatListNumbered,
  MdHotel,
  MdShield,
  MdPeople,
  MdCheck,
  MdErrorOutline,
  MdAccessTime
} from "react-icons/md";

const ICON_MAP = {
  MdLocalHospital,
  MdDescription,
  MdFormatListNumbered,
  MdHotel,
  MdShield,
  MdPeople,
};

const COLOR_MAP = {
  red: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500", glow: "shadow-red-500/20" },
  indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500", glow: "shadow-indigo-500/20" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500", glow: "shadow-orange-500/20" },
  blue: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500", glow: "shadow-blue-500/20" },
  teal: { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500", glow: "shadow-teal-500/20" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500", glow: "shadow-purple-500/20" },
};

const AGENT_KEYS = [
  "emergency_analysis",
  "report_analysis",
  "priority_classification",
  "bed_allocation",
  "risk_review",
  "coordination"
];

export default function WorkflowTimeline({
  agentResults = {},
  completedAgents = [],
  currentAgent = null,
  status = "idle",
  totalDuration = null
}) {
  const completedCount = completedAgents.length;
  const progressPercent = Math.round((completedCount / 6) * 100);

  const getStepState = (key) => {
    if (completedAgents.includes(key)) return "complete";
    if (currentAgent === key && status === "streaming") return "running";
    if (status === "complete" && agentResults[key]) return "complete";
    return "waiting";
  };

  const formatOutput = (output, key) => {
    if (!output) return null;
    if (output.error) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3 text-xs text-red-400 flex items-center gap-2">
          <MdErrorOutline className="text-base shrink-0" />
          <span>Error: {output.error}</span>
        </div>
      );
    }

    switch (key) {
      case "emergency_analysis": {
        const sev = output.severity_level || output.severity || "MEDIUM";
        const badgeColor = sev === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                           sev === "HIGH" ? "bg-orange-500/20 text-orange-400 border border-orange-500/40" :
                           sev === "MEDIUM" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                           "bg-green-500/20 text-green-400 border border-green-500/40";
        const text = output.emergency_assessment || output.assessment || output.intake_summary || (typeof output === "string" ? output : JSON.stringify(output));
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-lg p-3 mt-3 border border-slate-700/60 space-y-2.5 shadow-inner"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Triage Severity Assessment</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>{sev}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{text}</p>
          </motion.div>
        );
      }
      case "report_analysis": {
        const text = output.findings || output.summary || output.clinical_findings || (typeof output === "string" ? output : JSON.stringify(output));
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-lg p-3 mt-3 border border-slate-700/60 space-y-2 shadow-inner"
          >
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">RAG Document Analysis</span>
            <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
          </motion.div>
        );
      }
      case "priority_classification": {
        const prio = output.priority || output.priority_level || "MEDIUM";
        const badgeColor = prio === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                           prio === "HIGH" ? "bg-orange-500/20 text-orange-400 border border-orange-500/40" :
                           prio === "MEDIUM" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                           "bg-green-500/20 text-green-400 border border-green-500/40";
        const text = output.reasoning || (typeof output === "string" ? output : JSON.stringify(output));
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-lg p-3 mt-3 border border-slate-700/60 space-y-2.5 shadow-inner"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Calculated Priority</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>{prio}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
          </motion.div>
        );
      }
      case "bed_allocation": {
        const bedId = output.recommended_bed_id || output.bedId || "ICU-101";
        const ward = output.ward_type || output.ward || "General";
        const text = output.allocation_reasoning || output.reasoning || (typeof output === "string" ? output : JSON.stringify(output));
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-lg p-3 mt-3 border border-slate-700/60 space-y-2.5 shadow-inner"
          >
            <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded border border-slate-700/40">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Recommended Bed ID</span>
                <span className="text-lg font-mono font-bold text-blue-400">{bedId}</span>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {ward} Ward
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
          </motion.div>
        );
      }
      case "risk_review": {
        const riskLvl = output.risk_level || output.riskLevel || "NORMAL";
        const badgeColor = riskLvl === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                           riskLvl === "WARNING" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                           "bg-green-500/20 text-green-400 border border-green-500/40";
        const alerts = Array.isArray(output.alerts) ? output.alerts : [];
        const recs = Array.isArray(output.recommendations) ? output.recommendations : [];
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-lg p-3 mt-3 border border-slate-700/60 space-y-3 shadow-inner"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Hospital Risk Assessment</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>{riskLvl}</span>
            </div>
            {alerts.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">Active Alerts</span>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 bg-amber-500/5 p-2 rounded border border-amber-500/20">
                  {alerts.map((a, i) => (
                    <li key={i}>{typeof a === "string" ? a : a.message || JSON.stringify(a)}</li>
                  ))}
                </ul>
              </div>
            )}
            {recs.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-teal-400 uppercase font-bold block">Action Recommendations</span>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                  {recs.map((r, i) => (
                    <li key={i}>{typeof r === "string" ? r : JSON.stringify(r)}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        );
      }
      case "coordination": {
        const docName = output.assigned_doctor || "On-Duty Specialist";
        const text = output.care_briefing || output.summary || (typeof output === "string" ? output : JSON.stringify(output));
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-lg p-3 mt-3 border border-slate-700/60 space-y-2.5 shadow-inner"
          >
            <div className="flex items-center justify-between bg-purple-500/10 p-2.5 rounded border border-purple-500/30">
              <span className="text-[11px] text-purple-300 uppercase font-semibold">Assigned Physician</span>
              <span className="text-sm font-bold text-purple-400">{docName}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
          </motion.div>
        );
      }
      default:
        return <pre className="text-xs text-slate-400 mt-2 bg-slate-900/50 p-3 rounded">{JSON.stringify(output, null, 2)}</pre>;
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 md:p-8 shadow-2xl space-y-8">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <span>AI Analysis Workflow</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
              6 Agents Sequential
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time CrewAI agent execution pipeline and data aggregation
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {status === "streaming" ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-bold shadow-lg shadow-blue-500/10">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>Agents Working...</span>
            </div>
          ) : status === "complete" ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold shadow-lg shadow-green-500/10">
              <MdCheckCircle className="text-sm" />
              <span>Complete</span>
            </div>
          ) : status === "error" ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold shadow-lg shadow-red-500/10">
              <MdErrorOutline className="text-sm" />
              <span>Interrupted</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 text-xs font-semibold">
              <span>Idle</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Pipeline Progress ({completedCount} of 6 agents finished)</span>
          <span className="font-mono text-purple-400">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full shadow-md"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* 6 Timeline Steps */}
      <div className="space-y-0 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-700/40 before:z-0">
        {AGENT_INFO.map((agent, index) => {
          const stepKey = AGENT_KEYS[index];
          const stepState = getStepState(stepKey);
          const colors = COLOR_MAP[agent.color] || COLOR_MAP.blue;
          const IconComponent = ICON_MAP[agent.icon] || MdLocalHospital;
          const outputData = agentResults[stepKey];
          const isLast = index === AGENT_INFO.length - 1;

          return (
            <motion.div
              key={stepKey || index}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex gap-4 md:gap-6 relative z-10"
            >
              {/* Timeline step circle & connecting line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-md ${
                    stepState === "complete"
                      ? "bg-green-500/20 border-2 border-green-500 text-green-400 shadow-green-500/20"
                      : stepState === "running"
                      ? `${colors.bg} border-2 ${colors.border} ${colors.text} animate-pulse shadow-lg ${colors.glow}`
                      : "bg-slate-900 border-2 border-slate-700 text-slate-500"
                  }`}
                >
                  {stepState === "complete" ? (
                    <MdCheckCircle className="text-green-400 text-xl" />
                  ) : stepState === "running" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <IconComponent className="text-lg" />
                    </motion.div>
                  ) : (
                    <MdHourglassEmpty className="text-slate-500 text-lg" />
                  )}
                </div>

                {/* Connecting line between steps */}
                {!isLast && (
                  <div
                    className={`w-0.5 min-h-[50px] flex-1 transition-all duration-300 ${
                      stepState === "complete" ? "bg-green-500/80 shadow-sm shadow-green-500/50" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>

              {/* Step Content */}
              <div className={`flex-1 pb-8 transition-all duration-300 ${stepState === "running" ? "min-h-[100px]" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                      Step {index + 1}
                    </span>
                    <h3
                      className={`font-bold text-base transition-colors duration-300 ${
                        stepState === "complete" ? "text-green-400" :
                        stepState === "running" ? colors.text :
                        "text-slate-400"
                      }`}
                    >
                      {agent.name}
                    </h3>
                  </div>

                  {stepState === "complete" && (
                    <span className="text-[11px] font-semibold text-green-400 flex items-center gap-1">
                      <MdCheck /> Done
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 font-medium">{agent.role}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{agent.description}</p>

                {/* WAITING STATE */}
                {stepState === "waiting" && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/80 italic">
                    <MdHourglassEmpty className="text-sm" />
                    <span>Waiting for previous agents...</span>
                  </div>
                )}

                {/* RUNNING STATE */}
                {stepState === "running" && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700 flex items-center gap-3 ${colors.text}`}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-current animate-spin shrink-0" />
                    <span className="text-xs font-semibold animate-pulse">
                      Agent is working - calling tools and processing data...
                    </span>
                  </motion.div>
                )}

                {/* COMPLETE STATE */}
                {stepState === "complete" && outputData && (
                  <AnimatePresence>
                    {formatOutput(outputData, stepKey)}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Completion Info */}
      {(status === "complete" || (completedCount === 6 && totalDuration)) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-6 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4 md:p-6 shadow-xl"
        >
          <div className="flex items-center gap-3 text-green-400 font-bold text-base">
            <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center shrink-0">
              <MdCheckCircle className="text-xl" />
            </div>
            <span>All 6 agents completed</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700 font-mono">
            <MdAccessTime className="text-green-400 text-lg" />
            <span>Total execution time: <strong className="text-white font-bold">{totalDuration ? `${Number(totalDuration).toFixed(2)}s` : "Complete"}</strong></span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
