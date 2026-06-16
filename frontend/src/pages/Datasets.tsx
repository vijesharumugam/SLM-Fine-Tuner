import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from '../config';

const Datasets = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/datasets/`);
      if (res.ok) {
        const data = await res.json();
        setDatasets(data);
      }
    } catch (e) {
      console.error("Failed to fetch datasets", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/datasets/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchDatasets();
      }
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/datasets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDatasets();
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Dataset Management</h2>
        <p className="text-slate-400">Upload and process custom datasets for fine-tuning your Small Language Models.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4 relative z-10">Upload New Dataset</h3>
          
          <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer hover:bg-slate-800/50 hover:border-indigo-500/50 transition-all duration-300 relative z-10">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-3 text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-slate-500">CSV, JSON, or TXT</p>
            </div>
            <input id="file-upload" type="file" className="hidden" accept=".csv,.json,.txt" onChange={handleFileUpload} disabled={isUploading} />
          </label>
          {isUploading && <p className="mt-4 text-sm text-indigo-400 animate-pulse text-center">Uploading and processing...</p>}
        </div>

        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-xl">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center justify-between">
            <span>Available Datasets</span>
            <button onClick={fetchDatasets} className="text-xs text-slate-400 hover:text-indigo-400 transition-colors">↻ Refresh</button>
          </h3>
          {datasets.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-slate-500">
               <p>No datasets available. Upload one to get started.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 rounded-lg">
                  <tr>
                    <th scope="col" className="px-6 py-3 rounded-l-lg">Filename</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Samples</th>
                    <th scope="col" className="px-6 py-3 rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((ds) => (
                    <tr key={ds._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-200">{ds.filename}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          ds.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          ds.status === 'processing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {ds.status}
                        </span>
                        {ds.status === 'error' && ds.error_message && (
                          <div className="text-xs text-red-400 mt-1 max-w-[200px] truncate" title={ds.error_message}>
                            {ds.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{ds.stats?.total_samples || '-'}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDelete(ds._id)} className="text-slate-400 hover:text-red-400 transition-colors">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Datasets;
