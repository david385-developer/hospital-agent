import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineRefresh, HiOutlineDownload, HiOutlinePrinter } from 'react-icons/hi'
import PriorityBadge from '../Emergency/PriorityBadge'
import { STATUS_COLORS } from '../../utils/constants'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'emergency', label: 'Emergency Intake', key: 'emergency_analysis' },
  { id: 'report', label: 'Report Analysis', key: 'report_analysis' },
  { id: 'priority', label: 'Priority Classification', key: 'priority_classification' },
  { id: 'bed', label: 'Bed Allocation', key: 'bed_allocation' },
  { id: 'risk', label: 'Risk Monitor', key: 'risk_review' },
  { id: 'coordination', label: 'Care Coordination', key: 'coordination' },
]

const AnalysisResult = ({ analysis, patient, onRerun }) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('emergency')

  const data = analysis || {}
  const emergency = data.emergency_analysis
  const report = data.report_analysis
  const priority = data.priority_classification
  const bed = data.bed_allocation
  const risk = data.risk_review
  const coordination = data.coordination

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'emergency':
        if (!emergency) return <div className="rounded-xl border border-border p-8 text-center text-text-muted">No data available for this agent.</div>
        return (
          <div className="space-y-4">
            <div className={`rounded-xl border p-6 text-center ${STATUS_COLORS[emergency.severity_level || 'CRITICAL'] || 'bg-red-500/20 text-red-400 border-red-500/50'}`}>
              <p className="text-sm uppercase tracking-wider text-text-muted">Severity Level</p>
              <p className="mt-2 text-4xl font-bold">{emergency.severity_level || 'CRITICAL'}</p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-text-primary">Emergency Assessment</h4>
              <p className="text-sm leading-relaxed text-text-secondary">
                {emergency.emergency_assessment || emergency.assessment || emergency.intake_summary || (typeof emergency === 'string' ? emergency : JSON.stringify(emergency))}
              </p>
            </div>
            {emergency.key_findings && Array.isArray(emergency.key_findings) && (
              <div>
                <h4 className="mb-2 font-semibold text-text-primary">Key Findings</h4>
                <ul className="space-y-2">
                  {emergency.key_findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-critical" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      case 'report':
        if (!report) return <div className="rounded-xl border border-border p-8 text-center text-text-muted">No data available for this agent.</div>
        return (
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold text-text-primary">Clinical Findings & Report Summary</h4>
              <p className="text-sm leading-relaxed text-text-secondary">
                {report.findings || report.clinical_findings || report.summary || (typeof report === 'string' ? report : JSON.stringify(report))}
              </p>
            </div>
            {report.key_points && Array.isArray(report.key_points) && (
              <div>
                <h4 className="mb-2 font-semibold text-text-primary">Key Points</h4>
                <ul className="space-y-2">
                  {report.key_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      case 'priority':
        if (!priority) return <div className="rounded-xl border border-border p-8 text-center text-text-muted">No data available for this agent.</div>
        return (
          <div className="space-y-4">
            <div className="flex justify-center">
              <PriorityBadge priority={priority.priority_level || priority.priority || 'HIGH'} size="lg" />
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-text-primary">Classification Reasoning</h4>
              <p className="text-sm text-text-secondary">
                {priority.reasoning || (typeof priority === 'string' ? priority : JSON.stringify(priority))}
              </p>
            </div>
            {priority.queue_position !== undefined && (
              <div className="rounded-lg border border-border bg-bg-secondary p-4">
                <p className="text-sm text-text-muted">Queue Position</p>
                <p className="text-2xl font-bold text-text-primary">
                  #{priority.queue_position} in emergency queue
                </p>
              </div>
            )}
          </div>
        )

      case 'bed':
        if (!bed) return <div className="rounded-xl border border-border p-8 text-center text-text-muted">No data available for this agent.</div>
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-accent/50 bg-accent/10 p-6 text-center">
              <p className="text-sm text-text-muted">Recommended Bed</p>
              <p className="font-mono text-4xl font-bold text-accent">
                {bed.recommended_bed_id || bed.bedId || 'Unassigned'}
              </p>
              <span className="mt-2 inline-block rounded-full bg-blue-500/20 px-3 py-0.5 text-sm font-semibold text-blue-400">
                {bed.ward_type || bed.ward || 'General'}
              </span>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-text-primary">Allocation Reasoning</h4>
              <p className="text-sm text-text-secondary">
                {bed.allocation_reasoning || bed.reasoning || (typeof bed === 'string' ? bed : JSON.stringify(bed))}
              </p>
            </div>
            {bed.alternatives?.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold text-text-primary">Alternatives Considered</h4>
                <ul className="space-y-1">
                  {bed.alternatives.map((alt, i) => (
                    <li key={i} className="font-mono text-sm text-text-muted">• {alt}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => navigate('/beds')}
              className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Manage Bed Assignments
            </button>
          </div>
        )

      case 'risk':
        if (!risk) return <div className="rounded-xl border border-border p-8 text-center text-text-muted">No data available for this agent.</div>
        return (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 text-center ${STATUS_COLORS[risk.risk_level || 'WARNING'] || 'bg-amber-500/20 text-amber-400 border-amber-500/50'}`}>
              <p className="text-sm uppercase text-text-muted">Risk Level</p>
              <p className="text-3xl font-bold">{risk.risk_level || 'WARNING'}</p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-text-primary">Active Alerts</h4>
              <ul className="space-y-2">
                {(risk.alerts || []).map((alert, i) => (
                  <li key={i} className="rounded-lg border border-warning/30 bg-warning-bg p-3 text-sm text-warning">
                    {typeof alert === 'string' ? alert : alert.message || JSON.stringify(alert)}
                  </li>
                ))}
                {(!risk.alerts || risk.alerts.length === 0) && (
                  <li className="text-sm text-text-muted">No active risk alerts reported.</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-text-primary">Recommendations</h4>
              <ul className="space-y-2">
                {(risk.recommendations || []).map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-success">✓</span>
                    {typeof rec === 'string' ? rec : JSON.stringify(rec)}
                  </li>
                ))}
                {(!risk.recommendations || risk.recommendations.length === 0) && (
                  <li className="text-sm text-text-muted">No specific recommendations.</li>
                )}
              </ul>
            </div>
          </div>
        )

      case 'coordination':
        if (!coordination) return <div className="rounded-xl border border-border p-8 text-center text-text-muted">No data available for this agent.</div>
        return (
          <div className="space-y-4">
            {coordination.assigned_doctor && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                <p className="text-xs uppercase text-purple-300">Assigned Physician</p>
                <p className="text-xl font-bold text-purple-400 mt-1">{coordination.assigned_doctor}</p>
              </div>
            )}
            <div>
              <h4 className="mb-2 font-semibold text-text-primary">Care Coordination Briefing</h4>
              <p className="text-sm leading-relaxed text-text-secondary">
                {coordination.care_briefing || coordination.summary || (typeof coordination === 'string' ? coordination : JSON.stringify(coordination))}
              </p>
            </div>
            {coordination.next_steps && Array.isArray(coordination.next_steps) && (
              <div>
                <h4 className="mb-2 font-semibold text-text-primary">Action Plan & Next Steps</h4>
                <ul className="space-y-2">
                  {coordination.next_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-lg">
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-sm text-text-muted">
            {data.analysis_id || 'ANL-LATEST'}
          </p>
          <h2 className="text-xl font-bold text-text-primary">
            {patient?.name || data.patient_name || 'Patient'} Analysis Results
          </h2>
          <p className="text-sm text-text-secondary">
            {formatDate(data.created_at)} • 6-Agent Processing Time: {data.total_duration?.toFixed(1) || '14.1'}s
          </p>
        </div>
        <div className="flex gap-2">
          {onRerun && (
            <button
              onClick={onRerun}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover"
            >
              <HiOutlineRefresh className="h-4 w-4" />
              Re-run Analysis
            </button>
          )}
          <button
            onClick={() => toast('Export feature coming soon')}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted"
          >
            <HiOutlineDownload className="h-4 w-4" />
            Export Results
          </button>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AnalysisResult
