import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cpu, HardDrive, Database, Activity, RefreshCw } from 'lucide-react';
import api from '../services/api';

export const AdminMetrics = () => {
  // Fetch system performance metrics
  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const res = await api.get('/admin/system-metrics');
      return res.data?.data;
    },
    refetchInterval: 5000 // Auto poll every 5 seconds for telemetry updates
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Connecting telemetry streams...</span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="text-center py-12 glass-panel border border-white/5 rounded-2xl flex flex-col items-center gap-4">
        <span className="text-red-400 font-medium text-sm">Failed to connect to system metrics endpoints.</span>
        <button
          onClick={() => refetch()}
          className="bg-primary/20 text-primary font-semibold text-xs py-2 px-4 rounded-lg"
        >
          Reconnect Stream
        </button>
      </div>
    );
  }

  // Format uptime
  const days = Math.floor(metrics.uptimeSeconds / (3600 * 24));
  const hours = Math.floor((metrics.uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((metrics.uptimeSeconds % 3600) / 60);

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">System Metrics Telemetry</h1>
          <p className="text-gray-400 text-xs">Live server diagnostics and Atlas database latency diagnostics.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-white transition-all"
          title="Force Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU utilization */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs text-gray-400 font-semibold uppercase">
            <span>CPU Utilization</span>
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <span className="text-3xl font-extrabold text-white mt-2">
            {metrics.cpu?.usagePercent?.toFixed(1) || '0'}%
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            Active Core Count: {metrics.cpu?.coresCount || 'N/A'}
          </span>
        </div>

        {/* Memory Allocation */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs text-gray-400 font-semibold uppercase">
            <span>Memory Allocation</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-extrabold text-white mt-2">
            {metrics.memory?.usagePercent?.toFixed(1) || '0'}%
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            Used: {metrics.memory?.usedGb?.toFixed(2) || '0'} GB / {metrics.memory?.totalGb?.toFixed(1) || '0'} GB
          </span>
        </div>

        {/* DB Connection Latency */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs text-gray-400 font-semibold uppercase">
            <span>Database Latency</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-3xl font-extrabold text-white mt-2">
            {metrics.dbLatencyMs} ms
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            Atlas connection pool online
          </span>
        </div>

        {/* System Uptime */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs text-gray-400 font-semibold uppercase">
            <span>Uptime Duration</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl font-extrabold text-white mt-3 truncate">
            {days}d {hours}h {minutes}m
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            Node Environment: v{metrics.nodeVersion}
          </span>
        </div>
      </div>

      {/* Graphs/Visualizations representing utilization gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">Host Thread Load</h3>
          <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden border border-white/5 mt-2 flex">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${metrics.cpu?.usagePercent || 0}%` }} />
          </div>
          <span className="text-[10px] text-gray-400 mt-1">Multi-core processor utilization allocation.</span>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">Atlas Database Status</h3>
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl p-4 mt-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-white text-xs font-semibold">Active cloud connection is healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMetrics;
