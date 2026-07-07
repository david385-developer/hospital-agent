export const ROLE_PERMISSIONS = {
  Admin: ['all'],
  Doctor: ['view_patients', 'trigger_analysis', 'view_reports', 'view_beds', 'view_dashboard'],
  Nurse: ['add_patients', 'edit_patients', 'upload_reports', 'view_beds', 'view_dashboard'],
  Receptionist: ['add_patients', 'upload_reports', 'view_emergency_queue', 'view_dashboard']
}

export const STATUS_COLORS = {
  Admitted: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  'Under Review': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
  Discharged: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  Deceased: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/50' },
  Available: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  Occupied: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  Maintenance: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
  CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  MEDIUM: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
  LOW: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  NORMAL: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  WARNING: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' }
}

export const PRIORITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export const BED_TYPES = {
  ICU: { label: 'ICU', color: 'red', icon: 'MdLocalHospital' },
  Emergency: { label: 'Emergency', color: 'amber', icon: 'MdWarning' },
  General: { label: 'General', color: 'blue', icon: 'MdHotel' }
}

export const AGENT_INFO = [
  {
    name: "Emergency Intake Agent",
    role: "Emergency Intake Processor",
    description: "Queries patient database and scores symptoms",
    color: "red",
    icon: "MdLocalHospital"
  },
  {
    name: "Medical Report Analyzer",
    role: "Medical Document Analyzer",
    description: "Searches medical reports via RAG vector database",
    color: "indigo",
    icon: "MdDescription"
  },
  {
    name: "Triage Priority Agent",
    role: "Emergency Triage Coordinator",
    description: "Queries hospital stats and calculates priority",
    color: "orange",
    icon: "MdFormatListNumbered"
  },
  {
    name: "Resource Allocation Agent",
    role: "Hospital Resource Coordinator",
    description: "Queries beds and makes assignments in database",
    color: "blue",
    icon: "MdHotel"
  },
  {
    name: "Risk Monitor Agent",
    role: "Operations Risk Monitor",
    description: "Aggregates stats and generates operational alerts",
    color: "teal",
    icon: "MdShield"
  },
  {
    name: "Care Coordination Agent",
    role: "Treatment Coordination Specialist",
    description: "Finds doctors and updates patient records",
    color: "purple",
    icon: "MdPeople"
  }
];

export const NAV_ITEMS = [
  { label: "AI Agent", path: "/chat", icon: "MdSmartToy" },
  { label: 'Dashboard', path: '/dashboard', icon: 'FiGrid' },
  { label: 'Patients', path: '/patients', icon: 'FiUsers' },
  { label: 'Bed Management', path: '/beds', icon: 'FiBox' },
  { label: 'Emergency Queue', path: '/emergency', icon: 'FiAlertTriangle', showBadge: true },
  { label: 'Medical Reports', path: '/reports', icon: 'FiFileText' },
  { label: 'AI Analysis', path: '/analysis', icon: 'FiCpu' }
]

export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully signed in!',
  LOGIN_ERROR: 'Invalid email or password',
  REGISTER_SUCCESS: 'Account created successfully! Please sign in.',
  REGISTER_ERROR: 'Failed to create account',
  PATIENT_CREATED: 'Patient record created successfully',
  PATIENT_UPDATED: 'Patient record updated successfully',
  PATIENT_ERROR: 'Failed to save patient record',
  PATIENT_DELETED: 'Patient record deleted',
  BED_ASSIGNED: 'Bed assigned successfully',
  BED_RELEASED: 'Bed released successfully',
  BED_ERROR: 'Failed to update bed assignment',
  REPORT_UPLOADED: 'Report uploaded successfully',
  REPORT_ERROR: 'Failed to upload report',
  ANALYSIS_STARTED: 'AI analysis started',
  ANALYSIS_COMPLETE: 'Analysis completed successfully',
  ANALYSIS_ERROR: 'Analysis failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  LOGOUT_SUCCESS: 'Signed out successfully'
}

export const DEMO_CREDENTIALS = {
  email: 'admin@hospital.com',
  password: 'admin123'
}

export const WARD_COLORS = {
  ICU: '#ef4444',
  Emergency: '#f59e0b',
  General: '#3b82f6'
}

export const PRIORITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e'
}

export const SYMPTOM_SUGGESTIONS = [
  'Chest Pain',
  'Shortness of Breath',
  'High Fever',
  'Severe Headache',
  'Abdominal Pain',
  'Dizziness',
  'Nausea',
  'Rapid Heartbeat',
  'Loss of Consciousness',
  'Severe Bleeding',
  'Difficulty Breathing',
  'Seizures'
]

export const ROLE_DESCRIPTIONS = {
  Admin: 'Full system access including user management and system configuration',
  Doctor: 'Access patient records, trigger AI analyses, view medical reports',
  Nurse: 'Manage patient intake, update records, upload reports',
  Receptionist: 'Register patients, upload documents, view emergency queue'
}
