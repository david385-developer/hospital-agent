import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi'
import { bedsAPI } from '../../services/api'
import { TOAST_MESSAGES } from '../../utils/constants'
import useAuth from '../../hooks/useAuth'

const statusConfig = {
  Available: {
    dot: 'bg-success',
    border: 'border-l-success',
    bg: 'bg-success-bg',
    label: 'Available',
  },
  Occupied: {
    dot: 'bg-critical',
    border: 'border-l-critical',
    bg: 'bg-critical-bg',
    label: 'Occupied',
  },
  Maintenance: {
    dot: 'bg-warning',
    border: 'border-l-warning',
    bg: 'bg-warning-bg',
    label: 'Maintenance',
  },
}

const BedCard = ({ bed, unassignedPatients = [], onUpdate }) => {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const config = statusConfig[bed.status] || statusConfig.Available

  const filteredPatients = unassignedPatients.filter(
    (p) =>
      p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.patient_id?.toLowerCase().includes(patientSearch.toLowerCase())
  )

  const handleAssign = async (patientId) => {
    setLoading(true)
    try {
      await bedsAPI.assign(bed.bed_id, patientId)
      toast.success(TOAST_MESSAGES.BED_ASSIGNED)
      setShowAssignModal(false)
      onUpdate?.()
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to assign bed')
    } finally {
      setLoading(false)
    }
  }

  const handleRelease = async () => {
    setLoading(true)
    try {
      await bedsAPI.release(bed.bed_id)
      toast.success(TOAST_MESSAGES.BED_RELEASED)
      setShowReleaseConfirm(false)
      onUpdate?.()
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to release bed')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAvailable = async () => {
    setLoading(true)
    try {
      await bedsAPI.update(bed.bed_id, { status: 'Available' })
      toast.success('Bed marked as available')
      onUpdate?.()
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to update bed')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDuration = (assignedAt) => {
    if (!assignedAt) return '—'
    const days = Math.floor((Date.now() - new Date(assignedAt).getTime()) / (1000 * 60 * 60 * 24))
    return `${days} days`
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
        className={`rounded-xl border border-border border-l-[3px] ${config.border} ${config.bg} p-4 transition-shadow`}
      >
        <div className="flex items-start justify-between">
          <p className="font-mono text-lg font-bold text-text-primary">{bed.bed_id}</p>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${config.dot}`} />
            <span className="text-xs font-medium text-text-secondary">{config.label}</span>
          </div>
        </div>

        {bed.status === 'Occupied' && (
          <div className="mt-3 space-y-1 text-sm">
            <p className="font-medium text-text-primary">{bed.patient_name || 'Unknown Patient'}</p>
            <p className="font-mono text-xs text-text-muted">{bed.patient_id}</p>
            <p className="text-xs text-text-muted">Assigned: {formatDate(bed.assigned_at)}</p>
            <p className="text-xs text-text-muted">Duration: {getDuration(bed.assigned_at)}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate(`/patients/${bed.patient_id}`)}
                className="text-xs text-accent hover:underline"
              >
                View Patient
              </button>
              <button
                onClick={() => setShowReleaseConfirm(true)}
                className="rounded border border-critical/50 px-2 py-1 text-xs text-critical hover:bg-critical-bg"
              >
                Release Bed
              </button>
            </div>
          </div>
        )}

        {bed.status === 'Available' && (
          <div className="mt-3">
            <button
              onClick={() => setShowAssignModal(true)}
              className="w-full rounded-lg bg-accent py-2 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              Assign Patient
            </button>
          </div>
        )}

        {bed.status === 'Maintenance' && (
          <div className="mt-3">
            <p className="text-sm text-text-muted">Under Maintenance</p>
            {hasPermission('manage_beds') && (
              <button
                onClick={handleMarkAvailable}
                disabled={loading}
                className="mt-2 w-full rounded-lg border border-border py-2 text-xs font-medium text-text-primary hover:bg-surface-hover"
              >
                Mark Available
              </button>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-modal"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Assign Patient to {bed.bed_id}</h3>
                <button onClick={() => setShowAssignModal(false)} className="text-text-muted hover:text-text-primary">
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>
              <div className="relative mb-4">
                <HiOutlineSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patients..."
                  className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <p className="py-4 text-center text-sm text-text-muted">No unassigned patients found</p>
                ) : (
                  filteredPatients.map((p) => (
                    <button
                      key={p.patient_id}
                      onClick={() => handleAssign(p.patient_id)}
                      disabled={loading}
                      className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-surface-hover"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{p.name}</p>
                        <p className="font-mono text-xs text-text-muted">{p.patient_id}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReleaseConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-modal"
            >
              <h3 className="text-lg font-semibold text-text-primary">Release Bed?</h3>
              <p className="mt-2 text-sm text-text-secondary">
                This will release {bed.bed_id} from {bed.patient_name || 'the current patient'}.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowReleaseConfirm(false)}
                  className="flex-1 rounded-lg border border-border py-2 text-sm text-text-primary hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRelease}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-critical py-2 text-sm font-semibold text-white hover:bg-red-600"
                >
                  {loading ? 'Releasing...' : 'Release'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default BedCard
