import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, KeyRound, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import api from '../services/api';

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address.'),
  password: zod.string().min(8, 'Password must be at least 8 characters long.'),
});

const registerSchema = zod.object({
  firstName: zod.string().min(1, 'First name is required.'),
  lastName: zod.string().min(1, 'Last name is required.'),
  email: zod.string().email('Please enter a valid email address.'),
  password: zod.string().min(8, 'Password must be at least 8 characters long.'),
});

const forgotSchema = zod.object({
  email: zod.string().email('Please enter a valid email address.'),
});

const resetSchema = zod.object({
  password: zod.string().min(8, 'Password must be at least 8 characters long.'),
  confirmPassword: zod.string().min(8, 'Please confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addToast = useToast((s) => s.addToast);
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      if (res.data?.success) {
        const { user, tokens } = res.data.data;
        setSession(user, tokens);
        addToast(`Welcome back, ${user.fullName || user.firstName}!`, 'success');

        if (['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT_AGENT'].includes(user.role)) {
          navigate('/admin/dashboard');
        } else if (['SELLER', 'VERIFIED_SELLER'].includes(user.role)) {
          navigate('/seller/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial-gradient">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4),rgba(0,0,0,0.8))] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 glass-panel rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Commerce Control</h2>
          <p className="text-gray-400 text-sm mt-2">Enter credentials to log into your workspace</p>
        </div>

        {searchParams.get('session_expired') && (
          <div className="mb-6 p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-amber-200 text-xs text-center">
            Your session expired. Please log in again.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                {...register('email')}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                placeholder="example@commerce.com"
              />
            </div>
            {errors.email && (
              <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.email.message}</span>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-gray-400">
          New to Commerce?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">Create shopper account</Link>
        </div>
      </motion.div>
    </div>
  );
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      if (res.data?.success) {
        addToast('Shopper registration successful! Please log in.', 'success');
        navigate('/login');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed.';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial-gradient">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4),rgba(0,0,0,0.8))] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 glass-panel rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <User className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Shopper Account</h2>
          <p className="text-gray-400 text-sm mt-2">Sign up for the Commerce Intelligence portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">First Name</label>
              <input
                type="text"
                {...register('firstName')}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                placeholder="Harry"
              />
              {errors.firstName && (
                <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.firstName.message}</span>
              )}
            </div>
            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Last Name</label>
              <input
                type="text"
                {...register('lastName')}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                placeholder="Potter"
              />
              {errors.lastName && (
                <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                {...register('email')}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                placeholder="shopper@gmail.com"
              />
            </div>
            {errors.email && (
              <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.email.message}</span>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                {...register('password')}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-gray-400">
          Already registered?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">Log in instead</Link>
        </div>
      </motion.div>
    </div>
  );
};

export const ForgotPasswordPage = () => {
  const addToast = useToast((s) => s.addToast);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotSchema)
  });

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      addToast('Reset instructions dispatched.', 'info');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial-gradient">
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 glass-panel rounded-2xl p-8 shadow-2xl"
      >
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Log In
          </Link>
        </div>

        {!submitted ? (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Forgot Password</h2>
              <p className="text-gray-400 text-sm mt-2">Enter your email and we'll dispatch a link to reset your password</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                    placeholder="shopper@gmail.com"
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.email.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email Dispatched!</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
              If an account is associated with this email, we have dispatched your password recovery steps.
            </p>
            <Link
              to="/reset-password?token=mock_reset_token"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-semibold"
            >
              Simulate Resetting Password <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetSchema)
  });

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast('Password reset successfully. Please log in.', 'success');
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial-gradient">
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 glass-panel rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Your Password</h2>
          <p className="text-gray-400 text-sm mt-2">Enter your new security credentials below</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">New Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50"
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.password.message}</span>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.confirmPassword.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
          >
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
      addToast('Email verified successfully.', 'success');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial-gradient">
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 glass-panel rounded-2xl p-8 text-center shadow-2xl"
      >
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        
        {!verified ? (
          <>
            <h2 className="text-2xl font-bold text-white tracking-tight">Verify Your Email</h2>
            <p className="text-gray-400 text-sm mt-2 mb-6">
              Confirm your email registration to activate full Shopper capabilities.
            </p>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Now'}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white tracking-tight">Account Activated!</h2>
            <p className="text-gray-400 text-sm mt-2 mb-6">
              Thank you! Your shopper credentials have been fully verified.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-secondary hover:bg-white/10 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              Proceed to Log In
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
