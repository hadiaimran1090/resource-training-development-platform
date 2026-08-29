import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-8 text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          RTDP Platform
        </h1>
        <p className="text-slate-400 text-sm">
          Resource Training Development Platform - Project Initialized
        </p>
        <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full">
          Frontend & Tailwind CSS Ready
        </div>
      </div>
    </div>
  );
}

export default App;
