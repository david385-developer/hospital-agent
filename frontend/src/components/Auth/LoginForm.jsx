import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { TOAST_MESSAGES } from '../../utils/constants';
import toast from 'react-hot-toast';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiCpu, 
  FiActivity, 
  FiShield, 
  FiAlertCircle 
} from 'react-icons/fi';
import { FaHospital } from 'react-icons/fa';

export const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const newErrors = {};
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success(TOAST_MESSAGES.LOGIN_SUCCESS);
        navigate('/dashboard');
      } else {
        setApiError(result.error || TOAST_MESSAGES.LOGIN_ERROR);
        toast.error(result.error || TOAST_MESSAGES.LOGIN_ERROR);
      }
    } catch (err) {
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const useDemoCredentials = () => {
    setEmail('admin@hospital.com');
    setPassword('admin123');
    setErrors({});
    setApiError('');
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0e1a] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl bg-[#1e293b]/90 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 backdrop-blur-xl">
        
        {/* Left Panel - Hero Branding (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 border-r border-slate-700/50 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <FaHospital className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-white tracking-wide">MedOps AI</h2>
              <p className="text-xs text-blue-300 font-medium">Hospital Operations Platform</p>
            </div>
          </div>

          {/* Middle Hero Content */}
          <div className="space-y-6 my-auto relative z-10 py-12">
            <h1 className="text-3xl font-bold text-white leading-tight">
              AI-Powered Hospital Operations
            </h1>
            <p className="text-slate-300 text-base leading-relaxed">
              Emergency coordination, patient prioritization, and intelligent bed management powered by multi-agent AI workflows.
            </p>
          </div>

          {/* Bottom Feature Highlights */}
          <div className="grid grid-cols-1 gap-4 relative z-10 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <FiCpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Smart Triage</h4>
                <p className="text-xs text-slate-400">Instant severity assessment from clinical data</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
                <FiActivity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Real-Time Monitoring</h4>
                <p className="text-xs text-slate-400">Live bed occupancy and alert telemetry</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">AI Agent Workflows</h4>
                <p className="text-xs text-slate-400">Collaborative multi-agent decision support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-[#111827]/90">
          <div className="mb-8 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <FaHospital className="w-7 h-7" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
            <p className="text-sm text-slate-400 mt-1">Sign in to your operations center</p>
          </div>

          {/* API Error Box */}
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
              <FiAlertCircle className="w-5 h-5 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
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
                  placeholder="Enter your email"
                  className={`w-full bg-[#1e293b] text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-11 pr-4 py-3 border transition-all focus:outline-none focus:ring-1 ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-700/80 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  placeholder="Enter your password"
                  className={`w-full bg-[#1e293b] text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-11 pr-11 py-3 border transition-all focus:outline-none focus:ring-1 ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-slate-700/80 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Remember me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-400 hover:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs font-medium">Remember me</span>
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 px-4 transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#111827] px-3 text-slate-500 font-medium uppercase tracking-wider">
                or continue with
              </span>
            </div>
          </div>

          {/* Demo Credentials Info Box */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Demo Access</p>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Email: admin@hospital.com | Password: admin123
              </p>
            </div>
            <button
              type="button"
              onClick={useDemoCredentials}
              className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition-colors shrink-0"
            >
              Use Demo Credentials
            </button>
          </div>

          {/* Bottom Register Link */}
          <p className="mt-8 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Request Access
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;
