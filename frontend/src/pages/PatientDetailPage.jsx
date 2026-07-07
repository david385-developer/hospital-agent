import React, { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import PatientDetail from '../components/Patients/PatientDetail'
import PatientForm from '../components/Patients/PatientForm'
import { patientsAPI } from '../services/api'

const PatientDetailPage = () => {
  const { patient_id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [patient, setPatient] = useState(null)
  const isEdit = searchParams.get('edit') === 'true'

  React.useEffect(() => {
    if (isEdit && patient_id) {
      patientsAPI.getById(patient_id).then((patientData) => {
        if (patientData) setPatient(patientData)
      })
    }
  }, [isEdit, patient_id])

  if (isEdit) {
    return (
      <PatientForm
        initialData={patient}
        onSuccess={() => setSearchParams({})}
        onClose={() => setSearchParams({})}
      />
    )
  }

  return (
    <PatientDetail
      patientId={patient_id}
      onEdit={() => setSearchParams({ edit: 'true' })}
    />
  )
}

export default PatientDetailPage
