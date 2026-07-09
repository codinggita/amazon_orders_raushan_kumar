import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a110f] overflow-hidden relative selection:bg-primary/30 selection:text-white">
      <Helmet>
        <title>404 Not Found - CartX</title>
        <meta name="description" content="The page you are looking for does not exist." />
      </Helmet>
      
      <div className="absolute inset-0 bg-radial-gradient" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 glass-panel rounded-3xl p-10 md:p-16 max-w-lg text-center flex flex-col items-center gap-6 shadow-2xl border border-white/5"
      >
        <div className="w-20 h-20 rounded-2xl bg-black/40 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <AlertTriangle className="w-10 h-10 text-primary" />
        </div>
        
        <div>
          <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-lg mb-2">404</h1>
          <h2 className="text-xl font-bold text-slate-300">Signal Lost</h2>
        </div>
        
        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
          We couldn't locate the requested node in our orchestration network. The page may have been moved or no longer exists.
        </p>

        <Link 
          to="/"
          className="mt-4 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        >
          <Home className="w-4 h-4" /> Return to Base
        </Link>
      </motion.div>
    </div>
  );
};
