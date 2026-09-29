import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { RealtimeProvider, useRealtime } from './lib/realtime';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import IncidentDetail from './pages/IncidentDetail';
import ChaosButton from './components/ChaosButton';

function Header() {
  const location = useLocation();
  const { connected, incidents = [] } = useRealtime() || {};
  const activeIncidents = (incidents || []).filter((i) => i.status !== 'resolved');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = location.pathname === '/';
  const isConsole = location.pathname === '/console' || location.pathname === '/dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-black text-white font-extrabold flex items-center justify-center text-base shadow-md group-hover:scale-105 transition-transform">
            🤖
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-zinc-900 group-hover:text-black transition-colors">
              AI SRE Agent
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200">
              Hindsight Memory
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links (from reference layout) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
          <Link
            to="/"
            className={`transition-colors hover:text-black ${isHome ? 'text-black font-extrabold' : ''}`}
          >
            Overview
          </Link>
          <a
            href="/#about"
            className="transition-colors hover:text-black"
          >
            About Memory
          </a>
          <a
            href="/#process"
            className="transition-colors hover:text-black"
          >
            How It Works
          </a>
          <Link
            to="/console"
            className={`transition-colors hover:text-black flex items-center gap-2 ${isConsole ? 'text-black font-extrabold' : ''}`}
          >
            <span>Live Ops Console</span>
            {activeIncidents.length > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-600 text-white animate-pulse">
                {activeIncidents.length}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
            )}
          </Link>
          <a
            href="/#faq"
            className="transition-colors hover:text-black"
          >
            FAQ
          </a>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 live-dot' : 'bg-rose-500'}`} />
            <span>{connected ? 'SSE CONNECTED' : 'OFFLINE'}</span>
          </div>

          <Link
            to="/console"
            className="btn-black text-xs py-2 px-5"
          >
            <span>Launch Console ↗</span>
          </Link>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-6 py-4 space-y-3">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-zinc-900">Overview</Link>
          <Link to="/console" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-black">Live Ops Console</Link>
          <a href="/#about" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-zinc-600">About Memory</a>
          <a href="/#process" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-zinc-600">How It Works</a>
          <a href="/#faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-zinc-600">FAQ</a>
        </div>
      )}
    </header>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/console" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incident/:id" element={<IncidentDetail />} />
        </Routes>
      </main>

      {/* Footer in Creatiwise black section style */}
      <footer className="bg-[#0a0a0a] text-white py-12 px-6 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🤖</span>
              <span className="text-xl font-black">AI SRE Agent</span>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              Persistent memory powered by Hindsight vector storage. Autonomous incident triage, root cause synthesis, and blameless postmortems.
            </p>
          </div>
          <div className="flex gap-6 text-xs font-semibold text-zinc-400">
            <Link to="/" className="hover:text-white transition-colors">Overview</Link>
            <Link to="/console" className="hover:text-white transition-colors">Ops Console</Link>
            <a href="/#process" className="hover:text-white transition-colors">Process Workflow</a>
            <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RealtimeProvider>
        <AppContent />
      </RealtimeProvider>
    </BrowserRouter>
  );
}
