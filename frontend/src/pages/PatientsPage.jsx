import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import PatientTable from '../components/Patients/PatientTable';
import PatientForm from '../components/Patients/PatientForm';
import PatientDetail from '../components/Patients/PatientDetail';
import { motion, AnimatePresence } from 'framer-motion';

export const PatientsPage = () => {
  const { patient_id: id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const action = searchParams.get('action'); // 'create' or 'edit'
  const editId = searchParams.get('id') || id;

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const patientList = await patientsAPI.getAll();
      setPatients(Array.isArray(patientList) ? patientList : []);
    } catch (err) {
      // Fallback handled inside PatientTable defaults
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatientById = useCallback(async (patientId) => {
    try {
      const patient = await patientsAPI.getById(patientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    } catch (err) {
      // Find from loaded array or mock fallback
      const found = patients.find(p => p.id === patientId || p.id === `P-${patientId}`);
      if (found) setSelectedPatient(found);
    }
  }, [patients]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (id) {
      fetchPatientById(id);
    } else if (action === 'edit' && editId) {
      fetchPatientById(editId);
    } else {
      setSelectedPatient(null);
    }
  }, [id, action, editId, fetchPatientById]);

  const handleCloseForm = () => {
    if (id) {
      navigate(`/patients/${id}`);
    } else {
      navigate('/patients');
    }
  };

  const handleFormSuccess = () => {
    fetchPatients();
    handleCloseForm();
  };

  // 1. Detail View Mode
  if (id && action !== 'edit') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <PatientDetail 
          patient={selectedPatient || { id }} 
          onEdit={() => navigate(`/patients/${id}?action=edit`)}
          onRefresh={fetchPatients}
        />
      </motion.div>
    );
  }

  // 2. Table List View with Modal Overlay for Create/Edit
  return (
    <div className="space-y-6 relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <PatientTable 
          patients={patients} 
          loading={loading}
          onAddPatient={() => navigate('/patients?action=create')}
          onEditPatient={(patient) => navigate(`/patients?action=edit&id=${patient.id}`)}
        />
      </motion.div>

      {/* Modal Overlay for Form (Create/Edit) */}
      <AnimatePresence>
        {(action === 'create' || action === 'edit') && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl my-8"
            >
              <PatientForm
                initialData={action === 'edit' ? selectedPatient : null}
                onClose={handleCloseForm}
                onSuccess={handleFormSuccess}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientsPage;
