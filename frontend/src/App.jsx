import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import PatientDetailPage from './pages/PatientDetailPage'
import BedManagementPage from './pages/BedManagementPage'
import EmergencyQueuePage from './pages/EmergencyQueuePage'
import ReportsPage from './pages/ReportsPage'
import AIAnalysisPage from './pages/AIAnalysisPage'
import AgentChatPage from './pages/AgentChatPage'
import { motion } from 'framer-motion'

const ProtectedRoute = ({ children, isAuthenticated, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#334155] border-t-[#3b82f6] rounded-full animate-spin"></div>
          <p className="text-[#94a3b8]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

const NotFound = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a]">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center max-w-md"
    >
      <div className="text-6xl mb-4">🏥</div>
      <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Page Not Found</h1>
      <p className="text-[#94a3b8] mb-6">The page you're looking for doesn't exist.</p>
      <a
        href="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg transition-colors"
      >
        Return to Dashboard
      </a>
    </motion.div>
  </div>
)

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <Layout>
              <PatientsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:patient_id"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <Layout>
              <PatientDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/beds"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <Layout>
              <BedManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/emergency"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <Layout>
              <EmergencyQueuePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <Layout>
              <ReportsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <Layout>
              <AIAnalysisPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis/:analysis_id"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <Layout>
              <AIAnalysisPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <Layout>
              <AgentChatPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
