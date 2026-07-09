import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';

export const AdminLanding = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const isStaff = ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT_AGENT'].includes(user.role?.toUpperCase());
      if (isStaff) {
        navigate('/admin/dashboard');
      }
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Authentication Required</h2>
          <p className="text-slate-400 text-sm">Please log in with an administrator account to access this area.</p>
          <button 
            onClick={() => navigate('/login')} 
            className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold py-3 rounded-xl transition-all"
          >
            Sign In to Admin Portal
          </button>
        </div>
      </div>
    );
  }

  const isStaff = user.role && ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT_AGENT'].includes(user.role.toUpperCase());
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Unauthorized Access</h2>
          <p className="text-slate-400 text-sm">Your account does not have administrator permissions.</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-all"
          >
            Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      <span className="mt-4 text-slate-400 text-sm">Redirecting to Dashboard...</span>
    </div>
  );
};
