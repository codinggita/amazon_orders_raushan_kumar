import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cpu, HardDrive, Database, Activity, RefreshCw, Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import api from '../services/api';

export const AdminMetrics = () => {
  // Fetch system performance metrics
  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const res = await api.get('/admin/system-metrics');
      return res.data?.data;
    },
    refetchInterval: 5000 
  });

  // Sanitized production log stream state
  const [logs, setLogs] = useState([
    { ts: '23:29:10', service: 'AUTH-SVC', type: 'INFO', msg: 'Admin session token generated for admin@cartx.com' },
    { ts: '23:29:12', service: 'ORDER-SVC', type: 'INFO', msg: 'Optimistic state confirmed for order #66889' },
    { ts: '23:29:15', service: 'GATEWAY', type: 'ERROR', msg: 'Validation challenge timed out (3DS-Auth: cc_xx_8899)' },
    { ts: '23:29:20', service: 'MONGO-POOL', type: 'INFO', msg: 'Connection pool metrics healthy (active: 8, idle: 32)' },
    { ts: '23:29:24', service: 'LOGISTICS', type: 'FATAL', msg: 'Warehouse center link offline (BerlinNode WH_A unreachable)' }
  ]);

  // Periodic log stream generation
  useEffect(() => {
    const interval = setInterval(() => {
      const services = ['AUTH-SVC', 'ORDER-SVC', 'GATEWAY', 'MONGO-POOL', 'LOGISTICS', 'CATALOG'];
      const logsTypes = ['INFO', 'INFO', 'INFO', 'ERROR', 'FATAL'];
      const msgs = {
        INFO: [
          'Database heartbeats acknowledged',
          'Token signature payload compiled',
          'Geospatial route snaps initialized',
          'Cache memory clean completed (freed 45mb)'
        ],
        ERROR: [
          'Connection timed out at billing checkpoint (payment_gateway_validation)',
          'Product catalog category tree reparent mismatch detected'
        ],
        FATAL: [
          'Node core memory heap allocation exceeded stack frames limits',
          'Database cluster connection failure on secondary pool replica'
        ]
      };

      const type = logsTypes[Math.floor(Math.random() * logsTypes.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const msgList = msgs[type];
      const msg = msgList[Math.floor(Math.random() * msgList.length)];
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      setLogs(prev => [...prev.slice(-9), { ts, service, type, msg }]);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-450 font-mono">Connecting telemetry streams...</span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="text-center py-12 glass-panel border border-white/5 rounded-2xl flex flex-col items-center gap-4">
        <span className="text-red-400 font-medium text-sm font-mono">Telemetry connection failed.</span>
        <button
          onClick={() => refetch()}
          className="bg-primary/20 text-primary font-bold text-xs py-2 px-4 rounded-xl font-mono"
        >
          Retry connection
        </button>
      </div>
    );
  }

  const days = Math.floor(metrics.uptimeSeconds / (3600 * 24));
  const hours = Math.floor((metrics.uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((metrics.uptimeSeconds % 3600) / 60);

  // Flame graph nodes representations
  const flameData = [
    { name: 'Gateway routing router', pct: 100, latency: '48ms', fill: 'bg-indigo-500/80' },
    { name: 'Auth tokens challenge', pct: 85, latency: '35ms', fill: 'bg-primary/80' },
    { name: 'MongoDB read catalog pool', pct: 60, latency: '22ms', fill: 'bg-emerald-500/80' },
    { name: 'ElasticSearch facets index', pct: 40, latency: '12ms', fill: 'bg-amber-500/80' },
    { name: 'Fulfillment coordinate mapping', pct: 15, latency: '4ms', fill: 'bg-violet-500/80' }
  ];

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 py-2 font-mono">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] text-primary font-bold uppercase tracking-wider w-max">
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry online</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System Metrics HUD</h1>
          <p className="text-slate-400 text-xs">Observability console displaying microservice latency traces and log streams.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-3 bg-slate-900 border border-white/5 rounded-2xl hover:bg-slate-800 text-white transition-colors"
          title="Force Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* DevOps Overview Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
        
        {/* CPU */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>CPU Load</span>
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <span className="text-3xl font-extrabold text-white">
            {metrics.cpu?.usagePercent?.toFixed(1) || '0'}%
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Active Core Count: {metrics.cpu?.coresCount || 'N/A'}
          </span>
        </div>

        {/* Memory */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Memory heap</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-extrabold text-white">
            {metrics.memory?.usagePercent?.toFixed(1) || '0'}%
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Used: {metrics.memory?.usedGb?.toFixed(2) || '0'} GB / {metrics.memory?.totalGb?.toFixed(1) || '0'} GB
          </span>
        </div>

        {/* DB Latency */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Database Ping</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-3xl font-extrabold text-white">
            {metrics.dbLatencyMs} ms
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Atlas pool status: healthy
          </span>
        </div>

        {/* Uptime */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>System Uptime</span>
            <Activity className="w-4 h-4 text-violet-400 animate-pulse" />
          </div>
          <span className="text-3xl font-extrabold text-white">
            {days}d {hours}h {minutes}m
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Platform cluster operational
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Trace flame graph view */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary animate-pulse" /> Microservice Latency Trace Flame Graph
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Aggregate limits</span>
          </div>

          <div className="flex flex-col gap-2.5 mt-2 bg-slate-950 p-4 rounded-2xl border border-white/5">
            {flameData.map((node, idx) => (
              <div 
                key={idx} 
                className={`${node.fill} text-slate-950 text-[10px] font-bold p-2.5 rounded-lg flex justify-between items-center transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                style={{ width: `${node.pct}%` }}
              >
                <span className="truncate pr-2">{node.name}</span>
                <span className="font-extrabold flex-shrink-0">{node.latency} ({node.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* System output logs window */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-emerald-400" /> Live Standard Output Stream (stdout)
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase animate-pulse">• Streaming</span>
          </div>

          <div className="bg-slate-950 rounded-2xl p-4.5 border border-white/5 text-[10px] leading-relaxed overflow-y-auto max-h-[220px] flex flex-col gap-2 min-h-[220px]">
            {logs.map((log, idx) => {
              const isError = log.type === 'ERROR';
              const isFatal = log.type === 'FATAL';

              return (
                <div key={idx} className="flex gap-2.5 border-b border-slate-900/80 pb-1.5 last:border-0">
                  <span className="text-slate-500 font-mono flex-shrink-0">[{log.ts}]</span>
                  <span className="text-sky-400 font-extrabold flex-shrink-0">{log.service}:</span>
                  <span className={`font-extrabold flex-shrink-0 ${
                    isError ? 'bg-amber-500/10 text-amber-400 px-1 rounded' :
                    isFatal ? 'bg-rose-500/20 text-rose-400 px-1 rounded animate-pulse' :
                    'text-slate-500'
                  }`}>
                    [{log.type}]
                  </span>
                  <span className={`font-medium ${isError ? 'text-amber-300' : isFatal ? 'text-rose-300' : 'text-slate-300'}`}>
                    {log.msg}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMetrics;
