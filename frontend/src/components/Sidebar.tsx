import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const navItems = [
    { id: 'datasets', label: 'Datasets', icon: '📂' },
    { id: 'finetuning', label: 'Fine-Tuning', icon: '⚙️' },
    { id: 'models', label: 'Model Registry', icon: '📦' },
    { id: 'chat', label: 'Chat Interface', icon: '💬' },
    { id: 'monitoring', label: 'Monitoring', icon: '📊' }
  ];

  return (
    <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col p-4 shadow-2xl">
      <div className="flex items-center gap-3 mb-10 px-2 mt-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white font-bold">
          LLM
        </div>
        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Studio Pro
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out
              ${activeTab === item.id 
                ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/20 shadow-inner' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
          >
            <span>{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4 rounded-xl bg-slate-800/30 border border-slate-800 backdrop-blur-sm">
        <p className="text-xs text-slate-500 text-center">System Status: <span className="text-emerald-400">Online</span></p>
      </div>
    </div>
  );
};

export default Sidebar;
