import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000
})

const derivePatientPriority = (patient = {}) => {
  if (patient.priority) return patient.priority

  const notes = `${patient.emergency_notes || patient.emergencyNotes || ''}`.toUpperCase()
  if (notes.includes('CRITICAL')) return 'CRITICAL'
  if (notes.includes('HIGH')) return 'HIGH'
  if (patient.status === 'Admitted') return 'HIGH'
  if (patient.status === 'Under Review') return 'MEDIUM'
  return 'LOW'
}

const buildWaitTime = (admissionDate) => {
  if (!admissionDate) return ''

  const diffMs = Date.now() - new Date(admissionDate).getTime()
  if (Number.isNaN(diffMs) || diffMs < 0) return ''

  const totalMinutes = Math.floor(diffMs / 60000)
  if (totalMinutes < 60) return `${totalMinutes}m`

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

const mapPatient = (patient) => {
  if (!patient) return null

  const priority = derivePatientPriority(patient)
  const admissionDate = patient.admission_date || patient.admissionDate || ''

  return {
    ...patient,
    _id: patient._id || patient.id,
    id: patient.patient_id || patient.id,
    patient_id: patient.patient_id || patient.id,
    emergencyContact: patient.emergencyContact || patient.emergency_contact || '',
    emergency_contact: patient.emergency_contact || patient.emergencyContact || '',
    emergencyNotes: patient.emergencyNotes || patient.emergency_notes || '',
    emergency_notes: patient.emergency_notes || patient.emergencyNotes || '',
    assignedDoctor: patient.assignedDoctor || patient.assigned_doctor || '',
    assigned_doctor: patient.assigned_doctor || patient.assignedDoctor || '',
    assignedBed: patient.assignedBed || patient.assigned_bed_id || 'Unassigned',
    assigned_bed_id: patient.assigned_bed_id || patient.assignedBed || null,
    admissionDate,
    admission_date: admissionDate,
    createdBy: patient.createdBy || patient.created_by || '',
    created_by: patient.created_by || patient.createdBy || '',
    priority,
    waitMinutes: admissionDate ? Math.max(0, Math.floor((Date.now() - new Date(admissionDate).getTime()) / 60000)) : 0,
    waitTime: buildWaitTime(admissionDate),
    aiRecommendation:
      patient.aiRecommendation ||
      patient.ai_recommendation ||
      (patient.assigned_bed_id ? `${patient.assigned_bed_id} Assigned` : priority === 'CRITICAL' || priority === 'HIGH'
        ? 'ICU Bed Recommended'
        : 'Emergency Ward Bed')
  }
}

const mapBed = (bed) => {
  if (!bed) return null

  return {
    ...bed,
    _id: bed._id,
    id: bed.bed_id || bed.id,
    bed_id: bed.bed_id || bed.id,
    ward: bed.ward || bed.ward_type,
    ward_type: bed.ward_type || bed.ward,
    bedNumber: bed.bedNumber || bed.bed_number || '',
    bed_number: bed.bed_number || bed.bedNumber || '',
    patientId: bed.patientId || bed.assigned_patient_id || '',
    patient_id: bed.assigned_patient_id || bed.patient_id || bed.patientId || '',
    assigned_patient_id: bed.assigned_patient_id || bed.patient_id || bed.patientId || '',
    patientName: bed.patientName || bed.patient_name || '',
    patient_name: bed.patient_name || bed.patientName || '',
    assignedAt: bed.assignedAt || bed.assigned_at || '',
    assigned_at: bed.assigned_at || bed.assignedAt || '',
    releasedAt: bed.releasedAt || bed.released_at || '',
    released_at: bed.released_at || bed.releasedAt || '',
    wardType: bed.wardType || bed.ward_type || '',
    admissionTime: bed.assigned_at || bed.assignedAt || ''
  }
}

const mapReport = (report) => {
  if (!report) return null

  const fileUrl = report.file_url || report.cloudinary_url || ''
  const filename =
    report.filename ||
    report.file_name ||
    (fileUrl ? decodeURIComponent(fileUrl.split('/').pop().split('?')[0]) : '')

  return {
    ...report,
    id: report.report_id || report.id,
    report_id: report.report_id || report.id,
    filename,
    file_name: filename,
    patientId: report.patientId || report.patient_id || '',
    patient_id: report.patient_id || report.patientId || '',
    patient_name: report.patient_name || report.patientName || report.patient_id || 'Unknown Patient',
    patientName: report.patientName || report.patient_name || report.patient_id || 'Unknown Patient',
    fileUrl,
    file_url: fileUrl,
    cloudinary_url: fileUrl,
    extractedText: report.extractedText || report.extracted_text || '',
    extracted_text: report.extracted_text || report.extractedText || '',
    uploadDate: report.uploadDate || report.upload_date || report.uploaded_at || '',
    upload_date: report.upload_date || report.uploadDate || report.uploaded_at || '',
    uploaded_at: report.uploaded_at || report.upload_date || report.uploadDate || '',
    uploadedBy: report.uploadedBy || report.uploaded_by || '',
    uploaded_by: report.uploaded_by || report.uploadedBy || '',
    processed: report.processed ?? report.ai_processed ?? false,
    ai_processed: report.ai_processed ?? report.processed ?? false,
    text_extracted: report.text_extracted ?? report.ai_processed ?? report.processed ?? false
  }
}

const mapAnalysis = (analysis) => {
  if (!analysis) return null

  const emergency = analysis.emergency_analysis || {}
  const priority = analysis.priority_classification || {}
  const bed = analysis.bed_allocation || {}
  const summary = analysis.doctor_summary || {}
  const risk = analysis.risk_review || {}

  return {
    ...analysis,
    id: analysis.analysis_id || analysis.id,
    analysis_id: analysis.analysis_id || analysis.id,
    patientId: analysis.patientId || analysis.patient_id || '',
    patient_id: analysis.patient_id || analysis.patientId || '',
    createdAt: analysis.createdAt || analysis.created_at || '',
    created_at: analysis.created_at || analysis.createdAt || '',
    totalDuration: analysis.totalDuration || analysis.total_duration || 0,
    total_duration: analysis.total_duration || analysis.totalDuration || 0,
    executionTimeline: analysis.executionTimeline || analysis.execution_timeline || [],
    execution_timeline: analysis.execution_timeline || analysis.executionTimeline || [],
    emergency_analysis: {
      ...emergency,
      assessment: emergency.assessment || emergency.emergency_assessment || '',
      emergency_assessment: emergency.emergency_assessment || emergency.assessment || '',
      severity: emergency.severity || emergency.severity_level || '',
      severity_level: emergency.severity_level || emergency.severity || ''
    },
    priority_classification: {
      ...priority,
      priority_level: priority.priority_level || priority.priority || '',
      priority: priority.priority || priority.priority_level || '',
      reasoning: priority.reasoning || ''
    },
    bed_allocation: {
      ...bed,
      bedId: bed.bedId || bed.recommended_bed_id || '',
      recommended_bed_id: bed.recommended_bed_id || bed.bedId || '',
      ward: bed.ward || bed.ward_type || '',
      ward_type: bed.ward_type || bed.ward || '',
      reasoning: bed.reasoning || bed.allocation_reasoning || '',
      allocation_reasoning: bed.allocation_reasoning || bed.reasoning || ''
    },
    doctor_summary: {
      ...summary,
      summary_points:
        summary.summary_points ||
        (summary.summary ? summary.summary.split(/\n+/).filter(Boolean) : []),
      key_observations: summary.key_observations || [],
      recommended_actions: summary.recommended_actions || []
    },
    risk_review: {
      ...risk,
      riskLevel: risk.riskLevel || risk.risk_level || '',
      risk_level: risk.risk_level || risk.riskLevel || '',
      alerts: risk.alerts || [],
      recommendations: risk.recommendations || []
    }
  }
}

const mapDashboardStats = (stats) => {
  const bedsSummary = stats?.beds_summary || {}
  const icu = bedsSummary.ICU || {}
  const emergency = bedsSummary.Emergency || {}
  const general = bedsSummary.General || {}
  const recentAnalyses = Array.isArray(stats?.recent_analyses) ? stats.recent_analyses : []
  const totalBeds = (icu.total || 0) + (emergency.total || 0) + (general.total || 0)
  const occupiedBeds = (icu.occupied || 0) + (emergency.occupied || 0) + (general.occupied || 0)
  const criticalCases = recentAnalyses.filter((item) => item.severity === 'CRITICAL' || item.risk_level === 'CRITICAL').length

  return {
    ...stats,
    totalPatients: stats?.total_patients ?? 0,
    total_patients: stats?.total_patients ?? 0,
    occupiedBeds,
    totalBeds,
    emergencyQueueCount: stats?.queue_count ?? 0,
    emergency_queue_count: stats?.queue_count ?? 0,
    criticalCases,
    aiAnalysesToday: recentAnalyses.length,
    avgProcessingTime: recentAnalyses.length
      ? `${(recentAnalyses.reduce((sum, item) => sum + (item.total_duration || 0), 0) / recentAnalyses.length).toFixed(1)}s`
      : '0.0s',
    beds: {
      icuTotal: icu.total || 0,
      icuOccupied: icu.occupied || 0,
      icuAvailable: icu.available || 0,
      emergTotal: emergency.total || 0,
      emergOccupied: emergency.occupied || 0,
      emergAvailable: emergency.available || 0,
      genTotal: general.total || 0,
      genOccupied: general.occupied || 0,
      genAvailable: general.available || 0,
      icu,
      emergency,
      general
    },
    alerts: [
      ...(icu.total && (icu.occupied / icu.total) >= 0.9
        ? [{
            id: 'icu-capacity',
            severity: 'CRITICAL',
            message: `ICU occupancy at ${Math.round((icu.occupied / icu.total) * 100)}% capacity.`,
            timestamp: 'Live',
            actionLabel: 'Manage Beds',
            actionPath: '/beds'
          }]
        : []),
      ...(stats?.queue_count > 0
        ? [{
            id: 'queue-count',
            severity: stats.queue_count >= 5 ? 'CRITICAL' : 'WARNING',
            message: `${stats.queue_count} patients currently in the emergency queue.`,
            timestamp: 'Live',
            actionLabel: 'View Queue',
            actionPath: '/emergency'
          }]
        : [])
    ],
    recentActivity: recentAnalyses.map((item) => ({
      id: item.analysis_id,
      type: 'analysis',
      text: `AI analysis completed for ${item.patient_name} (${item.patient_id})`,
      timestamp: item.created_at,
      user: `Risk: ${item.risk_level}`,
      path: `/analysis/${item.patient_id}`
    })),
    recent_analyses: recentAnalyses
  }
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.response?.data?.message
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    if (error.response?.status === 403) {
      toast.error(message || 'Access denied')
    }
    if ([400, 404, 422, 500].includes(error.response?.status)) {
      toast.error(message || 'Request failed')
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials)
    return response.data.data
  },
  register: async (data) => {
    const response = await axiosInstance.post('/auth/register', data)
    return response.data.data
  }
}

export const patientsAPI = {
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/patients', { params })
    const patients = Array.isArray(response.data.data) ? response.data.data : []
    return patients.map(mapPatient)
  },
  getById: async (id) => {
    const response = await axiosInstance.get(`/patients/${id}`)
    return mapPatient(response.data.data)
  },
  create: async (data) => {
    const response = await axiosInstance.post('/patients', data)
    return mapPatient(response.data.data)
  },
  update: async (id, data) => {
    const response = await axiosInstance.put(`/patients/${id}`, data)
    return mapPatient(response.data.data)
  }
}

export const bedsAPI = {
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/beds', { params })
    const beds = Array.isArray(response.data.data) ? response.data.data : []
    return beds.map(mapBed)
  },
  create: async (data) => {
    const response = await axiosInstance.post('/beds', data)
    return mapBed(response.data.data)
  },
  update: async (id, data) => {
    const response = await axiosInstance.put(`/beds/${id}`, data)
    return mapBed(response.data.data)
  },
  assign: async (bedId, patientId) => {
    const response = await axiosInstance.post(`/beds/${bedId}/assign`, null, {
      params: { patient_id: patientId }
    })
    return mapBed(response.data.data)
  },
  release: async (bedId) => {
    const response = await axiosInstance.post(`/beds/${bedId}/release`)
    return mapBed(response.data.data)
  }
}

export const reportsAPI = {
  upload: async (formData) => {
    const response = await axiosInstance.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return mapReport(response.data.data)
  },
  getAll: async () => {
    const response = await axiosInstance.get('/reports')
    const reports = Array.isArray(response.data.data) ? response.data.data : []
    return reports.map(mapReport)
  },
  getById: async (id) => {
    const response = await axiosInstance.get(`/reports/${id}`)
    return mapReport(response.data.data)
  }
}

export const aiAPI = {
  analyzeEmergencyStream: (patientId, onMessage, onError, onComplete) => {
    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

    fetch(`${baseURL}/ai/analyze-emergency?patient_id=${patientId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "text/event-stream"
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      function processStream() {
        reader.read().then(({ done, value }) => {
          if (done) {
            onComplete();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                onMessage(data);
              } catch (e) {
                // skip malformed JSON
              }
            }
          }
          processStream();
        }).catch(err => onError(err));
      }
      processStream();
    }).catch(err => onError(err));
  },
  analyzeEmergency: async (patientId) => {
    const response = await axiosInstance.post('/ai/analyze-emergency', { patient_id: patientId })
    return mapAnalysis(response.data.data)
  },
  getAllAnalyses: async (params = {}) => {
    const response = await axiosInstance.get('/ai/analyses', { params })
    const analyses = Array.isArray(response.data.data) ? response.data.data : []
    return analyses.map(mapAnalysis)
  },
  getAnalysisById: async (id) => {
    const response = await axiosInstance.get(`/ai/analyses/${id}`)
    return mapAnalysis(response.data.data)
  }
}

export const dashboardAPI = {
  getStats: async () => {
    const response = await axiosInstance.get('/dashboard/stats')
    return mapDashboardStats(response.data.data)
  }
}

export default axiosInstance
