import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from '../config';

const FineTuning = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  
  const [config, setConfig] = useState({
    model_name: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
    dataset_id: '',
    lora_r: 8,
    lora_alpha: 16,
    batch_size: 4,
    epochs: 3,
    learning_rate: 0.0002,
    use_qlora: true
  });

  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetchDatasets();
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/datasets/`);
      if (res.ok) setDatasets(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/training/history`);
      if (res.ok) setJobs(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartTraining = async () => {
    if (!config.dataset_id) return alert("Please select a dataset.");
    setIsStarting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/training/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        fetchJobs();
      } else {
        const error = await res.json();
        alert(`Failed: ${error.detail}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsStarting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await fetch(`${API_BASE_URL}/training/job/${jobId}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j._id !== jobId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await fetch(`${API_BASE_URL}/training/clear/completed`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.status === 'running' || j.status === 'pending'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Fine-Tuning Module</h2>
        <p className="text-slate-400">Configure and start LoRA/QLoRA training jobs.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Configuration Panel */}
        <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-xl">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Training Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Base Model</label>
              <select 
                value={config.model_name}
                onChange={e => setConfig({...config, model_name: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="TinyLlama/TinyLlama-1.1B-Chat-v1.0">TinyLlama 1.1B (Fast, Low VRAM)</option>
                <option value="Qwen/Qwen2.5-0.5B">Qwen 2.5 0.5B (Very Fast, Ultra-Low VRAM)</option>
                <option value="microsoft/Phi-3-mini-4k-instruct">Phi-3 Mini (3.8B, Needs More VRAM)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Dataset</label>
              <select 
                value={config.dataset_id}
                onChange={e => setConfig({...config, dataset_id: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a dataset...</option>
                {datasets.filter(d => d.status === 'ready').map(ds => (
                  <option key={ds._id} value={ds._id}>{ds.filename} ({ds.stats?.total_samples || 0} samples)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Epochs</label>
                <input type="number" value={config.epochs} onChange={e => setConfig({...config, epochs: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Batch Size</label>
                <input type="number" value={config.batch_size} onChange={e => setConfig({...config, batch_size: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">LoRA R (Rank)</label>
                <input type="number" value={config.lora_r} onChange={e => setConfig({...config, lora_r: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Learning Rate</label>
                <input type="number" step="0.0001" value={config.learning_rate} onChange={e => setConfig({...config, learning_rate: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            <div className="flex items-center pt-2">
              <input 
                id="qlora-checkbox" 
                type="checkbox" 
                checked={config.use_qlora} 
                onChange={e => setConfig({...config, use_qlora: e.target.checked})}
                className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500 focus:ring-2" 
              />
              <label htmlFor="qlora-checkbox" className="ml-2 text-sm font-medium text-slate-300">
                Use QLoRA (4-bit Quantization) - <span className="text-emerald-400">Recommended for laptops</span>
              </label>
            </div>

            <button 
              onClick={handleStartTraining}
              disabled={isStarting || !config.dataset_id}
              className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg text-sm px-5 py-3 text-center focus:ring-4 focus:ring-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
            >
              {isStarting ? 'Starting Job...' : 'Start Training Job'}
            </button>
          </div>
        </div>

        {/* Jobs Panel */}
        <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-xl flex flex-col">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center justify-between">
            <span>Training Jobs</span>
            <div className="flex items-center gap-3">
              {jobs.some(j => j.status === 'completed' || j.status === 'failed') && (
                <button
                  onClick={handleClearCompleted}
                  className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded border border-slate-700 hover:border-red-500/40"
                >
                  Clear All
                </button>
              )}
              <span className="flex h-3 w-3 relative">
                {jobs.some(j => j.status === 'running') && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </>
                )}
              </span>
            </div>
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <p>No training jobs found.</p>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job._id} className="relative p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                  {/* Dismiss button — hidden while running */}
                  {job.status !== 'running' && job.status !== 'pending' && (
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      title="Dismiss"
                      className="absolute top-2 right-2 text-slate-600 hover:text-red-400 transition-colors text-base leading-none p-1"
                    >
                      ✕
                    </button>
                  )}
                  <div className="flex justify-between items-start mb-2 pr-6">
                    <h4 className="font-medium text-slate-200 text-sm truncate">{job.config.model_name.split('/').pop()}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      job.status === 'running' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' :
                      job.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>Started: {new Date(job.start_time).toLocaleString()}</div>
                    <div>Epochs: {job.config.epochs}</div>
                    <div>Batch: {job.config.batch_size}</div>
                    <div>LoRA R: {job.config.lora_r}</div>
                  </div>
                  {job.error && (
                    <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-900/50 overflow-x-auto">
                      {job.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FineTuning;
