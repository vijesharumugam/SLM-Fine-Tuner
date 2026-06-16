import React, { useState } from 'react';

import { API_BASE_URL } from '../config';

const Chat = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {role: 'assistant', content: 'Hello! I am your fine-tuned model. How can I help you today?'}
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, {role: 'user', content: userMessage}]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, max_tokens: 150 })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {role: 'assistant', content: data.response}]);
      } else {
        const error = await res.json();
        setMessages(prev => [...prev, {role: 'assistant', content: `[Error]: ${error.detail}`}]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {role: 'assistant', content: '[Error]: Failed to connect to server.'}]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <header className="mb-6 shrink-0">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Chat Interface</h2>
        <p className="text-slate-400">Interact with your currently loaded model in real-time.</p>
      </header>

      <div className="flex-1 min-h-[500px] bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 pointer-events-none"></div>
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-slate-800 border border-slate-700 text-slate-200'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl px-5 py-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 z-10">
          <form onSubmit={sendMessage} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..." 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !input.trim()}
              className="absolute right-2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
