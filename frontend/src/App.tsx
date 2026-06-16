import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Datasets from './pages/Datasets';
import FineTuning from './pages/FineTuning';
import Models from './pages/Models';
import Chat from './pages/Chat';
import Monitoring from './pages/Monitoring';

function App() {
  const [activeTab, setActiveTab] = useState('datasets');

  const renderContent = () => {
    switch(activeTab) {
      case 'datasets': return <Datasets />;
      case 'finetuning': return <FineTuning />;
      case 'models': return <Models />;
      case 'chat': return <Chat />;
      case 'monitoring': return <Monitoring />;
      default: return <Datasets />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/20 to-transparent -z-10 blur-3xl pointer-events-none"></div>
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
