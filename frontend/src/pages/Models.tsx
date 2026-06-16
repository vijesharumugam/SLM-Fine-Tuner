import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from '../config';

const Models = () => {
  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModel, setIsLoadingModel] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/models/`);
      if (res.ok) setModels(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this model?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/models/${id}`, { method: 'DELETE' });
      if (res.ok) fetchModels();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoad = async (id: string) => {
    setIsLoadingModel(id);
    try {
      const res = await fetch(`${API_BASE_URL}/models/load/${id}`, { method: 'POST' });
      if (res.ok) {
        alert("Model loaded successfully into memory. You can now chat with it!");
      } else {
        const error = await res.json();
        alert(`Failed: ${error.detail}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingModel(null);
    }
  };

  const handleDownload = (id: string, name: string) => {
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/models/download/${id}`;
    link.download = `${name}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Model Registry</h2>
        <p className="text-slate-400">Manage your fine-tuned models, load them into memory, and view metrics.</p>
      </header>

      <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center justify-between">
          <span>Trained Models</span>
          <button onClick={fetchModels} className="text-xs text-slate-400 hover:text-indigo-400 transition-colors">↻ Refresh</button>
        </h3>
        
        {models.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-40 text-slate-500">
             <p>No trained models available. Start a fine-tuning job first.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 rounded-lg">
                <tr>
                  <th scope="col" className="px-6 py-3 rounded-l-lg">Model Name</th>
                  <th scope="col" className="px-6 py-3">Base Model</th>
                  <th scope="col" className="px-6 py-3">Epochs</th>
                  <th scope="col" className="px-6 py-3">Created At</th>
                  <th scope="col" className="px-6 py-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{m.name}</td>
                    <td className="px-6 py-4 text-slate-400">{m.config?.model_name.split('/').pop()}</td>
                    <td className="px-6 py-4 text-slate-400">{m.config?.epochs}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(m.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button 
                        onClick={() => handleLoad(m._id)}
                        disabled={isLoadingModel !== null}
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:opacity-50"
                      >
                        {isLoadingModel === m._id ? 'Loading...' : 'Load'}
                      </button>
                      <button
                        onClick={() => handleDownload(m._id, m.name)}
                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                        title="Download model as ZIP"
                      >
                        ⬇ Download
                      </button>
                      <button onClick={() => handleDelete(m._id)} className="text-slate-400 hover:text-red-400 transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Models;
