import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { TOAST_MESSAGES } from '../../utils/constants';
import toast from 'react-hot-toast';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiAlertCircle, 
  FiInfo 
} from 'react-icons/fi';
import { FaHospital } from 'react-icons/fa';

export const RegisterForm = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const getRoleDescription = (selectedRole) => {
    switch (selectedRole) {
      case 'Doctor':
        return "Access patient records, trigger AI analyses, view medical reports";
      case 'Nurse':
        return "Manage patient intake, update records, upload reports";
      case 'Receptionist':
        return "Register patients, upload documents, view emergency queue";
      default:
        return null;
    }
  };

  const calculatePasswordStrength = (pass) => {
    if (!pass) return { level: 0, label: '', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;

    if (score === 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { level: 2, label: 'Medium', color: 'bg-amber-500' };
    if (score === 3) return { level: 3, label: 'Strong', color: 'bg-green-500' };
    return { level: 0, label: '', color: 'bg-slate-700' };
  };

  const strength = calculatePasswordStrength(password);

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required.';
    
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email format.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!role || role === 'Select your role') {
      newErrors.role = 'Please select your operational role.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      await authAPI.register({
        name: fullName,
        email: email,
        password: password,
        role: role
      });
      toast.success(TOAST_MESSAGES.REGISTER_SUCCESS);
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check your information and try again.';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0e1a] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-lg bg-[#1e293b]/90 border border-slate-700/60 rounded-2xl shadow-2xl p-8 sm:p-10 backdrop-blur-xl relative overflow-hidden">
        
        {/* Top Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <FaHospital className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create Your Account</h1>
          <p className="text-sm text-slate-400 mt-1">Join the hospital operations platform</p>
        </div>

        {/* API Error Box */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
            <FiAlertCircle className="w-5 h-5 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors({ ...errors, fullName: '' });
                }}
                placeholder="Dr. Jane Smith"
                className={`w-full bg-[#111827] text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-11 pr-4 py-3 border transition-all focus:outline-none focus:ring-1 ${
                  errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="jane.smith@hospital.com"
                className={`w-full bg-[#111827] text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-11 pr-4 py-3 border transition-all focus:outline-none focus:ring-1 ${
                  errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                placeholder="Create a strong password"
                className={`w-full bg-[#111827] text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-11 pr-4 py-3 border transition-all focus:outline-none focus:ring-1 ${
                  errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-blue-500'
                }`}
              />
            </div>
            {/* Strength indicator */}
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 transition-colors duration-300 ${strength.level >= 1 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-colors duration-300 ${strength.level >= 2 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-colors duration-300 ${strength.level >= 3 ? strength.color : 'bg-transparent'}`} />
                </div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 w-12 text-right">{strength.label}</span>
              </div>
            )}
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                placeholder="Re-enter your password"
                className={`w-full bg-[#111827] text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-11 pr-4 py-3 border transition-all focus:outline-none focus:ring-1 ${
                  errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Your Role
            </label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (errors.role) setErrors({ ...errors, role: '' });
              }}
              className={`w-full bg-[#111827] text-slate-100 text-sm rounded-xl px-4 py-3 border transition-all focus:outline-none focus:ring-1 ${
                errors.role ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-blue-500'
              }`}
            >
              <option value="">Select your role</option>
              <option value="Doctor">Doctor</option>
              <option value="Nurse">Nurse</option>
              <option value="Receptionist">Receptionist</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-400">{errors.role}</p>}

            {/* Role description info box */}
            {role && getRoleDescription(role) && (
              <div className="mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2">
                <FiInfo className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{getRoleDescription(role)}</span>
              </div>
            )}

            <p className="mt-1.5 text-[11px] text-slate-500 italic">
              Note: Admin accounts are created by system administrators only.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 px-4 transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Bottom Login Link */}
        <p className="mt-8 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterForm;
