import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from '../config';

const Monitoring = () => {
  const [metrics, setMetrics] = useState({ cpu_percent: 0, ram_percent: 0, disk_percent: 0 });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/system/metrics`);
        if (res.ok) setMetrics(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">System Monitoring</h2>
        <p className="text-slate-400">Real-time resource utilization for your local environment.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col items-center">
          <h3 className="text-slate-400 font-medium mb-4">CPU Usage</h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3"/>
              <path strokeDasharray={`${metrics.cpu_percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="3" className="transition-all duration-1000"/>
            </svg>
            <div className="absolute text-2xl font-bold text-white">{metrics.cpu_percent}%</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col items-center">
          <h3 className="text-slate-400 font-medium mb-4">RAM Usage</h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3"/>
              <path strokeDasharray={`${metrics.ram_percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8b5cf6" strokeWidth="3" className="transition-all duration-1000"/>
            </svg>
            <div className="absolute text-2xl font-bold text-white">{metrics.ram_percent}%</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col items-center">
          <h3 className="text-slate-400 font-medium mb-4">Storage Usage</h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3"/>
              <path strokeDasharray={`${metrics.disk_percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" className="transition-all duration-1000"/>
            </svg>
            <div className="absolute text-2xl font-bold text-white">{metrics.disk_percent}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
