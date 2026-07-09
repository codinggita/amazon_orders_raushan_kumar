import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSystemHealth } from '../services/resourceApi';
import { ShieldCheck, ShieldAlert, HeartPulse, RefreshCw } from 'lucide-react';

export const HealthPage = () => {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    refetchInterval: 15000,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg w-full space-y-6 shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HeartPulse className={`w-8 h-8 ${isLoading || isRefetching ? 'text-sky-400 animate-pulse' : 'text-emerald-400'}`} />
            <div>
              <h1 className="text-xl font-bold">System Health</h1>
              <p className="text-xs text-slate-400">Real-time Node/Express API status check</p>
            </div>
          </div>
          <button 
            onClick={() => refetch()} 
            disabled={isLoading || isRefetching}
            className="p-2 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${(isLoading || isRefetching) && 'animate-spin'}`} />
          </button>
        </div>

        {/* Display Status */}
        {isLoading ? (
          <div className="text-center py-6 text-slate-400 text-sm">Pinging health route...</div>
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3 text-red-400">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Connection Failed</h3>
              <p className="text-xs text-slate-400 mt-1">Backend service at localhost:5001 is offline or unreachable.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start space-x-3 text-emerald-400">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">All Systems Operational</h3>
                <p className="text-xs text-slate-400 mt-1">Ready to receive and orchestrate transaction logs.</p>
              </div>
            </div>

            {/* System Specs */}
            <div className="bg-slate-950 rounded-xl p-4 space-y-2 text-xs border border-slate-800/80">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="font-semibold text-emerald-400">{data?.status || 'UP'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Message</span>
                <span className="text-slate-200">{data?.message || 'Express REST engine verified.'}</span>
              </div>
              {data?.data && Object.entries(data.data).map(([key, val]) => (
                <div className="flex justify-between" key={key}>
                  <span className="text-slate-400 capitalize">{key}</span>
                  <span className="text-slate-200">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default HealthPage;
