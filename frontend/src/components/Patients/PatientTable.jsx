import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STATUS_COLORS } from '../../utils/constants';
import { 
  FiPlus, 
  FiSearch, 
  FiEye, 
  FiEdit2, 
  FiCpu, 
  FiClipboard, 
  FiChevronLeft, 
  FiChevronRight,
  FiFilter
} from 'react-icons/fi';

export const PatientTable = ({ patients = [], loading = false, onAddPatient, onEditPatient }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('Newest First');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const defaultPatients = [
    {
      id: 'P-1042',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      status: 'Admitted',
      symptoms: ['Severe Chest Pain', 'Shortness of Breath', 'Diaphoresis', 'Dizziness'],
      assignedBed: 'ICU-103',
      assignedDoctor: 'Dr. Sarah Chen',
      admissionDate: '2025-01-15',
      hasReports: true,
      emergencyNotes: 'Patient presented with acute coronary syndrome symptoms. Immediate triage required.'
    },
    {
      id: 'P-1043',
      name: 'Maria Garcia',
      age: 62,
      gender: 'Female',
      status: 'Under Review',
      symptoms: ['High Fever', 'Severe Headache', 'Neck Stiffness'],
      assignedBed: 'EMERG-204',
      assignedDoctor: 'Dr. James Wilson',
      admissionDate: '2025-01-15',
      hasReports: true,
      emergencyNotes: 'Suspected meningitis. Awaiting lumbar puncture lab results.'
    },
    {
      id: 'P-1044',
      name: 'Robert Smith',
      age: 29,
      gender: 'Male',
      status: 'Discharged',
      symptoms: ['Mild Concussion', 'Contusions'],
      assignedBed: 'Unassigned',
      assignedDoctor: 'Dr. Emily Brown',
      admissionDate: '2025-01-14',
      hasReports: false,
      emergencyNotes: ''
    },
    {
      id: 'P-1045',
      name: 'Anita Patel',
      age: 51,
      gender: 'Female',
      status: 'Admitted',
      symptoms: ['Abdominal Pain', 'Nausea', 'Vomiting'],
      assignedBed: 'GEN-310',
      assignedDoctor: 'Dr. Sarah Chen',
      admissionDate: '2025-01-13',
      hasReports: true,
      emergencyNotes: 'Acute pancreatitis under observation.'
    }
  ];

  const displayList = patients.length > 0 ? patients : defaultPatients;

  // Filter & Sort Logic
  const filteredPatients = displayList.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.symptoms && p.symptoms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesStatus = statusFilter === 'All Statuses' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'Newest First') return new Date(b.admissionDate) - new Date(a.admissionDate);
    if (sortBy === 'Oldest First') return new Date(a.admissionDate) - new Date(b.admissionDate);
    if (sortBy === 'Name A-Z') return a.name.localeCompare(b.name);
    return 0;
  });

  // Pagination Logic
  const totalResults = filteredPatients.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRows = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatSymptoms = (symptoms = []) => {
    if (!symptoms || symptoms.length === 0) return 'None recorded';
    if (symptoms.length <= 3) return symptoms.join(', ');
    return `${symptoms.slice(0, 3).join(', ')}... (${symptoms.length - 3} more)`;
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl shadow-lg flex flex-col overflow-hidden">
      {/* Table Header */}
      <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Patient Records</h2>
          <p className="text-xs text-slate-400 mt-0.5">Showing {totalResults} patients</p>
        </div>
        <button
          onClick={onAddPatient || (() => navigate('/patients?action=create'))}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-[#111827]/60 border-b border-slate-700/50 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by name, ID, or symptoms..."
            className="w-full bg-[#1e293b] text-slate-200 placeholder-slate-400 text-sm rounded-lg pl-10 pr-4 py-2 border border-slate-700/80 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#1e293b] text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2 border border-slate-700/80 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Admitted">Admitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Discharged">Discharged</option>
            <option value="Deceased">Deceased</option>
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#1e293b] text-slate-200 text-sm rounded-lg px-4 py-2 border border-slate-700/80 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
          >
            <option value="Newest First">Newest First</option>
            <option value="Oldest First">Oldest First</option>
            <option value="Name A-Z">Name A-Z</option>
            <option value="Priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111827]/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
              <th className="py-3.5 px-4">Patient ID</th>
              <th className="py-3.5 px-4">Name</th>
              <th className="py-3.5 px-4">Age / Gender</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Symptoms</th>
              <th className="py-3.5 px-4">Assigned Bed</th>
              <th className="py-3.5 px-4">Assigned Doctor</th>
              <th className="py-3.5 px-4">Admission Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40 text-sm">
            {loading ? (
              /* Loading Shimmer Rows */
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-shimmer">
                  <td className="p-4"><div className="h-4 w-16 bg-slate-700/50 rounded" /></td>
                  <td className="p-4"><div className="h-4 w-28 bg-slate-700/50 rounded" /></td>
                  <td className="p-4"><div className="h-4 w-16 bg-slate-700/50 rounded" /></td>
                  <td className="p-4"><div className="h-5 w-20 bg-slate-700/50 rounded-full" /></td>
                  <td className="p-4"><div className="h-4 w-36 bg-slate-700/50 rounded" /></td>
                  <td className="p-4"><div className="h-4 w-16 bg-slate-700/50 rounded" /></td>
                  <td className="p-4"><div className="h-4 w-24 bg-slate-700/50 rounded" /></td>
                  <td className="p-4"><div className="h-4 w-20 bg-slate-700/50 rounded" /></td>
                  <td className="p-4"><div className="h-6 w-20 bg-slate-700/50 rounded ml-auto" /></td>
                </tr>
              ))
            ) : currentRows.length > 0 ? (
              currentRows.map((patient) => {
                const statusStyle = STATUS_COLORS[patient.status] || 'bg-slate-700 text-slate-300';
                const hasEmergencyNotes = !!patient.emergencyNotes && patient.emergencyNotes.trim().length > 0;

                return (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="hover:bg-slate-700/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-4 font-mono font-semibold text-blue-400">
                      {patient.id}
                    </td>
                    <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                      <span>{patient.name}</span>
                      {hasEmergencyNotes && (
                        <span 
                          title="Contains emergency triage notes" 
                          className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-sm shadow-red-500"
                        />
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {patient.age} / {patient.gender}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusStyle}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300 max-w-xs truncate" title={patient.symptoms?.join(', ')}>
                      {formatSymptoms(patient.symptoms)}
                    </td>
                    <td className="py-4 px-4 font-mono font-medium">
                      {patient.assignedBed && patient.assignedBed !== 'Unassigned' ? (
                        <span className="text-green-400">{patient.assignedBed}</span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {patient.assignedDoctor || 'Unassigned'}
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-xs">
                      {formatDate(patient.admissionDate)}
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditPatient ? onEditPatient(patient) : navigate(`/patients?action=edit&id=${patient.id}`)}
                          title="Edit Patient"
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>

                        {patient.hasReports && (
                          <button
                            onClick={() => navigate(`/analysis/${patient.id}`)}
                            title="Run AI Analysis"
                            className="p-1.5 text-purple-400 hover:text-purple-300 rounded-lg hover:bg-purple-500/10 transition-colors"
                          >
                            <FiCpu className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              /* Empty State */
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mx-auto mb-4">
                    <FiClipboard className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">No Patients Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                    Add your first patient to get started, or adjust your search filters to find existing records.
                  </p>
                  <button
                    onClick={onAddPatient || (() => navigate('/patients?action=create'))}
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-1.5"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Add Patient</span>
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalResults > 0 && (
        <div className="p-4 bg-[#111827]/80 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
          <div>
            Showing <span className="text-slate-200 font-bold">{startIndex + 1}</span> to <span className="text-slate-200 font-bold">{Math.min(startIndex + itemsPerPage, totalResults)}</span> of <span className="text-slate-200 font-bold">{totalResults}</span> results
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 px-2.5"
            >
              <FiChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-semibold flex items-center justify-center transition-all ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                      : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 px-2.5"
            >
              <span>Next</span>
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTable;
