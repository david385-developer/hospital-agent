import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';
import EmergencyQueue from '../components/Emergency/EmergencyQueue';
import BedModal from '../components/Beds/BedModal';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw } from 'react-icons/fi';

export const EmergencyQueuePage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal for assigning bed directly from Emergency queue
  const [activeAssignPatient, setActiveAssignPatient] = useState(null);

  const fetchEmergencyPatients = useCallback(async () => {
    setLoading(true);
    try {
      const list = await patientsAPI.getAll();
      // Filter for emergency / unassigned / critical
      if (list.length > 0) {
        const emerg = list.filter(p => 
          p.status === 'Admitted' || 
          p.status === 'Under Review' || 
          !p.assignedBed || 
          p.assignedBed === 'Unassigned' ||
          p.priority === 'HIGH' ||
          p.priority === 'CRITICAL'
        );
        setPatients(emerg.length > 0 ? emerg : list);
      }
    } catch (err) {
      // Fallback handled inside EmergencyQueue default list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencyPatients();

    // Auto-refresh polling every 30 seconds
    const interval = setInterval(() => {
      fetchEmergencyPatients();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchEmergencyPatients]);

  const handleTriage = (patient) => {
    navigate(`/analysis/${patient.id}`);
  };

  const handleAssignBed = (patient) => {
    // Determine target ward based on priority or recommendation
    const ward = patient.priority === 'HIGH' || patient.priority === 'CRITICAL' ? 'ICU' : 'Emergency';
    // Pre-select an available bed for this modal
    const mockBed = {
      id: ward === 'ICU' ? 'ICU-109' : 'EMR-211',
      bed_id: ward === 'ICU' ? 'ICU-109' : 'EMR-211',
      ward: ward,
      ward_type: ward,
      status: 'Available'
    };
    setActiveAssignPatient({
      patientId: patient.id,
      bed: mockBed
    });
  };

  return (
    <div className="space-y-6 relative pb-12">
      {/* Optional Top Polling Indicator */}
      <div className="flex items-center justify-end gap-2 text-xs text-slate-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>Live emergency telemetry (auto-refreshing every 30s)</span>
        <button
          onClick={fetchEmergencyPatients}
          disabled={loading}
          className="p-1 rounded hover:bg-slate-800 text-slate-300 transition-colors ml-1"
          title="Refresh Now"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Emergency Queue Board */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <EmergencyQueue
          patients={patients}
          onAssignBed={handleAssignBed}
          onTriage={handleTriage}
        />
      </motion.div>

      {/* Bed Assignment Modal Overlay */}
      <AnimatePresence>
        {activeAssignPatient && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl my-8"
            >
              <BedModal
                bed={activeAssignPatient.bed}
                initialPatientId={activeAssignPatient.patientId}
                onClose={() => setActiveAssignPatient(null)}
                onSuccess={() => {
                  setActiveAssignPatient(null);
                  fetchEmergencyPatients();
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmergencyQueuePage;
