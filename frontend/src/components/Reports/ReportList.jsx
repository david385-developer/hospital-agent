import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from 'react-icons/hi'
import { FiActivity } from 'react-icons/fi'
import { reportsAPI } from '../../services/api'

const DEMO_REPORTS = [
  {
    report_id: 'RPT-001',
    filename: 'patient_john_doe_blood_work.pdf',
    patient_name: 'John Doe',
    patient_id: 'PAT-A1B2C3',
    uploaded_at: '2025-01-15T14:30:00',
    uploaded_by: 'Dr. Sarah Chen',
    processed: true,
    extracted_text: 'Complete Blood Count results: WBC 14.2 x10^9/L (elevated), Hemoglobin 11.8 g/dL, Platelets 245 x10^9/L. Differential shows neutrophilia. CRP elevated at 45 mg/L suggesting active inflammation...',
    cloudinary_url: '#',
  },
  {
    report_id: 'RPT-002',
    filename: 'maria_garcia_ct_scan.pdf',
    patient_name: 'Maria Garcia',
    patient_id: 'PAT-D4E5F6',
    uploaded_at: '2025-01-15T11:15:00',
    uploaded_by: 'Dr. Michael Torres',
    processed: true,
    extracted_text: 'CT Head without contrast: No acute intracranial hemorrhage. Mild cerebral edema noted in right frontal region. No midline shift...',
    cloudinary_url: '#',
  },
  {
    report_id: 'RPT-003',
    filename: 'robert_wilson_xray.pdf',
    patient_name: 'Robert Wilson',
    patient_id: 'PAT-G7H8I9',
    uploaded_at: '2025-01-14T16:45:00',
    uploaded_by: 'Nurse Patel',
    processed: false,
    extracted_text: '',
    cloudinary_url: '#',
  },
]

const ReportList = ({ refreshKey = 0 }) => {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [refreshKey])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const reportList = await reportsAPI.getAll()
      setReports(reportList?.length ? reportList : DEMO_REPORTS)
    } catch {
      setReports(DEMO_REPORTS)
    } finally {
      setLoading(false)
    }
  }

  const filtered = reports.filter((r) => {
    if (filter === 'processed') return r.processed || r.ai_processed
    if (filter === 'pending') return !r.processed && !r.ai_processed
      return true
  })

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  if (loading) {
    return <div className="h-64 animate-shimmer rounded-xl" />
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-12 text-center shadow-lg">
        <HiOutlineDocumentText className="mx-auto h-16 w-16 text-text-muted" />
        <h3 className="mt-4 text-xl font-semibold text-text-primary">No Reports Uploaded</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Upload your first medical report to enable AI-powered analysis.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mt-6 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Upload Report
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-lg">
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Medical Reports</h2>
          <p className="text-sm text-text-secondary">{reports.length} reports uploaded</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Reports' },
            { key: 'processed', label: 'Processed by AI' },
            { key: 'pending', label: 'Pending Processing' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                filter === f.key ? 'bg-accent text-white' : 'bg-surface-hover text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        {filtered.map((report, i) => {
          const isProcessed = report.processed || report.ai_processed
          const text = report.extracted_text || report.text_preview || ''

          return (
            <motion.div
              key={report.report_id || report._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-bg-secondary p-5"
            >
              <div className="flex items-start gap-3">
                <HiOutlineDocumentText className="h-8 w-8 shrink-0 text-critical" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">
                    {report.filename || report.file_name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {report.patient_name} • <span className="font-mono">{report.patient_id}</span>
                  </p>
                  <p className="mt-1 text-xs text-text-muted">{formatDate(report.upload_date || report.uploaded_at || report.created_at)}</p>
                  <p className="text-xs text-text-muted">Uploaded by {report.uploaded_by}</p>
                </div>
                {isProcessed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success">
                    <HiOutlineCheckCircle className="h-3 w-3" />
                    AI Processed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
                    <HiOutlineClock className="h-3 w-3" />
                    Pending Processing
                  </span>
                )}
              </div>

              {text && (
                <p className="mt-3 line-clamp-2 text-xs text-text-muted">
                  {text.slice(0, 100)}{text.length > 100 ? '...' : ''}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {(report.cloudinary_url || report.file_url) && (
                  <a
                    href={report.cloudinary_url || report.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover"
                  >
                    View PDF
                  </a>
                )}
                {text && (
                  <button
                    onClick={() => setExpandedId(expandedId === report.report_id ? null : report.report_id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover"
                  >
                    View Extracted Text
                  </button>
                )}
                {isProcessed && (
                  <button
                    onClick={() => navigate(`/analysis?patient=${report.patient_id}`)}
                    className="inline-flex items-center gap-1 rounded-lg bg-purple-600/20 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-600/30"
                  >
                    <FiActivity className="h-3 w-3" />
                    Run AI Analysis
                  </button>
                )}
              </div>

              {expandedId === report.report_id && text && (
                <div className="mt-3 rounded-lg border border-border bg-surface p-3 text-xs text-text-secondary">
                  {text}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default ReportList
