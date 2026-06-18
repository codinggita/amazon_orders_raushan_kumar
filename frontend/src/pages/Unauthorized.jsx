import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial-gradient">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5),rgba(0,0,0,0.9))] pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10 glass-panel rounded-2xl p-8 text-center shadow-2xl border border-white/10">
        <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
          <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          You do not possess the required security roles or scopes to explore this restricted administrative view.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-2.5 rounded-lg text-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Shopper Portal
          </Link>
          <Link
            to="/login"
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
