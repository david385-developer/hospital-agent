import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI } from '../../services/api';
import { TOAST_MESSAGES } from '../../utils/constants';
import toast from 'react-hot-toast';
import { 
  FiUser, 
  FiPhone, 
  FiAlertCircle, 
  FiX, 
  FiPlus, 
  FiSave, 
  FiArrowLeft 
} from 'react-icons/fi';

const PRE_DEFINED_SYMPTOMS = [
  "Chest Pain",
  "Shortness of Breath",
  "High Fever",
  "Severe Headache",
  "Abdominal Pain",
  "Dizziness",
  "Nausea",
  "Rapid Heartbeat",
  "Loss of Consciousness",
  "Severe Bleeding",
  "Difficulty Breathing",
  "Seizures"
];

export const PatientForm = ({ initialData = null, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const isEditMode = !!initialData && !!initialData.id;

  const [fullName, setFullName] = useState(initialData?.name || '');
  const [age, setAge] = useState(initialData?.age || '');
  const [gender, setGender] = useState(initialData?.gender || '');
  const [contactNumber, setContactNumber] = useState(initialData?.contact || '');
  const [emergencyContact, setEmergencyContact] = useState(initialData?.emergencyContact || '');
  
  const [symptoms, setSymptoms] = useState(initialData?.symptoms || []);
  const [symptomInput, setSymptomInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const [emergencyNotes, setEmergencyNotes] = useState(initialData?.emergencyNotes || '');
  const [status, setStatus] = useState(initialData?.status || 'Admitted');
  const [assignedDoctor, setAssignedDoctor] = useState(initialData?.assignedDoctor || 'Dr. Sarah Chen');
  
  const [doctorsList, setDoctorsList] = useState([
    'Dr. Sarah Chen',
    'Dr. James Wilson',
    'Dr. Emily Brown',
    'Dr. Michael Vance',
    'Dr. Elena Rostova'
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFullName(initialData?.name || '');
    setAge(initialData?.age || '');
    setGender(initialData?.gender || '');
    setContactNumber(initialData?.contact || '');
    setEmergencyContact(initialData?.emergencyContact || initialData?.emergency_contact || '');
    setSymptoms(initialData?.symptoms || []);
    setEmergencyNotes(initialData?.emergencyNotes || initialData?.emergency_notes || '');
    setStatus(initialData?.status || 'Admitted');
    setAssignedDoctor(initialData?.assignedDoctor || initialData?.assigned_doctor || 'Dr. Sarah Chen');
  }, [initialData]);

  useEffect(() => {
    if (symptomInput.trim().length > 0) {
      const filtered = PRE_DEFINED_SYMPTOMS.filter(
        s => s.toLowerCase().includes(symptomInput.toLowerCase()) && !symptoms.includes(s)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [symptomInput, symptoms]);

  const handleAddSymptom = (symptomToAdd) => {
    const val = symptomToAdd || symptomInput.trim();
    if (!val) return;
    if (!symptoms.includes(val)) {
      setSymptoms([...symptoms, val]);
      if (errors.symptoms) setErrors({ ...errors, symptoms: '' });
    }
    setSymptomInput('');
    setSuggestions([]);
  };

  const handleRemoveSymptom = (indexToRemove) => {
    setSymptoms(symptoms.filter((_, idx) => idx !== indexToRemove));
  };

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Patient full name is required.';
    
    if (!age && age !== 0) {
      newErrors.age = 'Age is required.';
    } else if (isNaN(age) || Number(age) < 0 || Number(age) > 150) {
      newErrors.age = 'Age must be a valid number between 0 and 150.';
    }

    if (!gender || gender === 'Select Gender') {
      newErrors.gender = 'Please select a gender.';
    }

    if (symptoms.length === 0) {
      newErrors.symptoms = 'At least one symptom must be recorded.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the validation errors before saving.');
      return;
    }

    setIsLoading(true);
    const payload = {
      name: fullName,
      age: Number(age),
      gender,
      contact: contactNumber,
      emergency_contact: emergencyContact,
      symptoms,
      emergency_notes: emergencyNotes,
      status,
      assigned_doctor: assignedDoctor
    };

    try {
      if (isEditMode) {
        await patientsAPI.update(initialData.id, payload);
        toast.success(TOAST_MESSAGES.PATIENT_UPDATED);
      } else {
        await patientsAPI.create(payload);
        toast.success(TOAST_MESSAGES.PATIENT_CREATED);
      }
      if (onSuccess) onSuccess();
      else if (onClose) onClose();
      else navigate('/patients');
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (isEditMode ? TOAST_MESSAGES.PATIENT_ERROR : TOAST_MESSAGES.PATIENT_ERROR)
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl shadow-2xl p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-700/50 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isEditMode ? 'Edit Patient Record' : 'Register New Patient'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isEditMode ? `Updating clinical telemetry for patient ID: ${initialData.id}` : 'Enter patient demographic and emergency triage telemetry'}
          </p>
        </div>
        <button
          onClick={onClose || (() => navigate('/patients'))}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Close Form"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Personal Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <FiUser className="w-4 h-4" />
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors({ ...errors, fullName: '' }); }}
                placeholder="Enter patient full name"
                className={`w-full bg-[#111827] text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-2.5 border transition-all focus:outline-none focus:ring-1 ${
                  errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-blue-500'
                }`}
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>}
            </div>

            {/* Age & Gender Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Age <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => { setAge(e.target.value); if (errors.age) setErrors({ ...errors, age: '' }); }}
                  placeholder="Age"
                  className={`w-full bg-[#111827] text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-2.5 border transition-all focus:outline-none focus:ring-1 ${
                    errors.age ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-blue-500'
                  }`}
                />
                {errors.age && <p className="mt-1 text-xs text-red-400">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Gender <span className="text-red-400">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => { setGender(e.target.value); if (errors.gender) setErrors({ ...errors, gender: '' }); }}
                  className={`w-full bg-[#111827] text-slate-100 text-sm rounded-xl px-3 py-2.5 border transition-all focus:outline-none focus:ring-1 ${
                    errors.gender ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-blue-500'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="mt-1 text-xs text-red-400">{errors.gender}</p>}
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Contact Number
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-[#111827] text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-700/80 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Emergency Contact
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Emergency contact name and phone"
                className="w-full bg-[#111827] text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-2.5 border border-slate-700/80 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Medical Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <FiAlertCircle className="w-4 h-4" />
            <span>Medical & Emergency Information</span>
          </h3>

          {/* Symptoms Multi-Tag Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Symptoms <span className="text-red-400">*</span>
            </label>
            <div className={`p-3 bg-[#111827] border rounded-xl transition-all ${
              errors.symptoms ? 'border-red-500' : 'border-slate-700/80 focus-within:border-blue-500'
            }`}>
              {/* Tag List */}
              <div className="flex flex-wrap gap-2 mb-2">
                {symptoms.map((symptom, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  >
                    <span>{symptom}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(idx)}
                      className="hover:text-red-400 focus:outline-none transition-colors"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Input Field */}
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSymptom(); } }}
                  placeholder="Type a symptom and press Enter..."
                  className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddSymptom()}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0 flex items-center gap-1"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Autocomplete Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 self-center mr-1">Suggestions:</span>
                  {suggestions.map((sugg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddSymptom(sugg)}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.symptoms && <p className="mt-1 text-xs text-red-400">{errors.symptoms}</p>}
          </div>

          {/* Emergency Notes */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>Emergency Notes (Urgent Triage)</span>
              </label>
              <span className={`text-xs font-mono ${emergencyNotes.length >= 450 ? 'text-amber-400' : 'text-slate-500'}`}>
                {emergencyNotes.length}/500
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
              placeholder="Describe the emergency situation, vital signs, initial observations, oxygen saturation, or pain level..."
              className="w-full bg-[#111827] text-slate-100 placeholder-slate-500 text-sm rounded-xl p-4 border-2 border-red-500/50 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all leading-relaxed"
            />
          </div>

          {/* Status & Doctor Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Patient Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#111827] text-slate-100 text-sm rounded-xl px-4 py-2.5 border border-slate-700/80 focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="Admitted">Admitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Discharged">Discharged</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Assigned Doctor
              </label>
              <select
                value={assignedDoctor}
                onChange={(e) => setAssignedDoctor(e.target.value)}
                className="w-full bg-[#111827] text-slate-100 text-sm rounded-xl px-4 py-2.5 border border-slate-700/80 focus:outline-none focus:border-blue-500 transition-all"
              >
                {doctorsList.map((doc, idx) => (
                  <option key={idx} value={doc}>{doc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-700/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onClose || (() => navigate('/patients'))}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Record...</span>
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                <span>{isEditMode ? 'Update Patient Record' : 'Create Patient Record'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
