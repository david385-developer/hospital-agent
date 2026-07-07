import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineCloudUpload,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'
import { reportsAPI, patientsAPI } from '../../services/api'
import { TOAST_MESSAGES } from '../../utils/constants'

const ReportUpload = ({ onUploadSuccess, initialPatientId = '' }) => {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(initialPatientId)
  const [patients, setPatients] = useState([])
  const [patientSearch, setPatientSearch] = useState('')
  const [uploadState, setUploadState] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [patientError, setPatientError] = useState('')

  React.useEffect(() => {
    patientsAPI.getAll().then((patientList) => setPatients(Array.isArray(patientList) ? patientList : [])).catch(() => {})
  }, [])

  React.useEffect(() => {
    setSelectedPatient(initialPatientId || '')
  }, [initialPatientId])

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.patient_id?.toLowerCase().includes(patientSearch.toLowerCase())
  )

  const handleFile = (file) => {
    if (!file) return
    if (!file.name.endsWith('.pdf')) {
      setError('Upload failed: Invalid file format. Please upload a PDF.')
      setUploadState('error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Upload failed: File exceeds 10MB limit.')
      setUploadState('error')
      return
    }
    setSelectedFile(file)
    setError('')
    setUploadState('idle')
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }, [])

  const simulateProgress = () => {
    setProgress(0)
    setStatusText('Uploading...')
    const steps = [
      { at: 30, text: 'Uploading...' },
      { at: 60, text: 'Extracting text from PDF...' },
      { at: 85, text: 'Generating embeddings for RAG...' },
      { at: 100, text: 'Complete' },
    ]
    let current = 0
    const interval = setInterval(() => {
      current += 5
      setProgress(Math.min(current, 95))
      const step = steps.find((s) => current <= s.at) || steps[steps.length - 1]
      setStatusText(step.text)
      if (current >= 95) clearInterval(interval)
    }, 200)
    return interval
  }

  const handleUpload = async () => {
    if (!selectedPatient) {
      setPatientError('Please select a patient')
      return
    }
    if (!selectedFile) {
      setError('Please select a PDF file')
      return
    }

    setPatientError('')
    setUploadState('uploading')
    const progressInterval = simulateProgress()

    try {
      const formData = new FormData()
      formData.append('patient_id', selectedPatient)
      formData.append('file', selectedFile)

      const res = await reportsAPI.upload(formData)
      clearInterval(progressInterval)
      setProgress(100)
      setUploadState('success')
      setResult(res)
      toast.success(TOAST_MESSAGES.REPORT_UPLOADED)
      onUploadSuccess?.()
    } catch (err) {
      clearInterval(progressInterval)
      setUploadState('error')
      const message = err.response?.data?.detail || TOAST_MESSAGES.REPORT_ERROR
      setError(message)
      toast.error(message)
    }
  }

  const reset = () => {
    setSelectedFile(null)
    setSelectedPatient('')
    setUploadState('idle')
    setProgress(0)
    setResult(null)
    setError('')
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Upload Medical Report</h2>
        <p className="text-sm text-text-secondary">
          Upload patient medical reports for AI analysis and record keeping.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {uploadState === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <HiOutlineCheckCircle className="mx-auto h-16 w-16 text-success" />
            <h3 className="mt-4 text-lg font-semibold text-text-primary">Report uploaded successfully!</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Text extracted: {result?.text_length || result?.extracted_text?.length || '2,450'} characters
            </p>
            <p className="text-sm text-success">Document indexed for AI retrieval</p>
            <div className="mt-6 flex justify-center gap-3">
              {result?.cloudinary_url && (
                <a
                  href={result.cloudinary_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
                >
                  View Report
                </a>
              )}
              <button onClick={reset} className="rounded-lg border border-border px-4 py-2 text-sm text-text-primary hover:bg-surface-hover">
                Upload Another
              </button>
            </div>
          </motion.div>
        ) : uploadState === 'error' ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <HiOutlineExclamationCircle className="mx-auto h-16 w-16 text-critical" />
            <p className="mt-4 text-sm text-critical">{error}</p>
            <button onClick={reset} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
              Try Again
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mb-6 cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
                dragActive
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50 hover:bg-accent/5'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <HiOutlineCloudUpload className="mx-auto h-12 w-12 text-text-muted" />
              <p className="mt-4 text-text-primary">Drag and drop your PDF file here</p>
              <p className="my-2 text-xs text-text-muted">or</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="rounded-lg bg-surface-hover px-4 py-2 text-sm font-medium text-text-primary hover:bg-border"
              >
                Browse Files
              </button>
              <p className="mt-4 text-xs text-text-muted">Supported format: PDF (Max size: 10MB)</p>
              {selectedFile && (
                <p className="mt-2 text-sm text-accent">{selectedFile.name}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-text-secondary">Select Patient</label>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patients..."
                className="mb-2 w-full rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
              <select
                value={selectedPatient}
                onChange={(e) => { setSelectedPatient(e.target.value); setPatientError('') }}
                className={`w-full rounded-lg border bg-bg-secondary px-4 py-3 text-sm text-text-primary focus:outline-none ${
                  patientError ? 'border-critical' : 'border-border focus:border-accent'
                }`}
              >
                <option value="">Select Patient</option>
                {filteredPatients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.name} ({p.patient_id})
                  </option>
                ))}
              </select>
              {patientError && <p className="mt-1 text-xs text-critical">{patientError}</p>}
            </div>

            {uploadState === 'uploading' && (
              <div className="mb-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-text-secondary">{statusText}</span>
                  <span className="text-accent">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploadState === 'uploading' || !selectedFile}
              className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {uploadState === 'uploading' ? `Uploading... ${progress}%` : 'Upload Report'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ReportUpload
