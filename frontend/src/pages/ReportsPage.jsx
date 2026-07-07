import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ReportUpload from '../components/Reports/ReportUpload'
import ReportList from '../components/Reports/ReportList'

const ReportsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchParams] = useSearchParams()
  const patientId = searchParams.get('patientId') || ''

  return (
    <div className="space-y-8">
      <ReportUpload initialPatientId={patientId} onUploadSuccess={() => setRefreshKey((k) => k + 1)} />
      <ReportList refreshKey={refreshKey} />
    </div>
  )
}

export default ReportsPage
