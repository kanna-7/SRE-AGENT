import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRealtime } from '../lib/realtime';
import { listIncidents } from '../lib/api';
import ChaosButton from '../components/ChaosButton';

const SEV = { 'SEV-1': 'sev-1', 'SEV-2': 'sev-2', 'SEV-3': 'sev-3', 'SEV-4': 'sev-4' };
const ST = { open: 'st-open', diagnosing: 'st-diagnosing', remediating: 'st-remediating', resolved: 'st-resolved' };
const ST_LABEL = { open: '● Open', diagnosing: '⚡ Diagnosing', remediating: '🔧 Remediating', resolved: '✅ Resolved' };

function timeAgo(ts) {
  const s = (Date.now() - new Date(ts)) / 1000;
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function StatCard({ icon, label, value, subtext }) {
  return (
    <div className="cw-card p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl flex-shrink-0 text-black border border-zinc-200">
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-0.5">{label}</p>
          <p className="text-2xl font-black mono text-black">{value}</p>
        </div>
      </div>
      {subtext && (
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
          {subtext}
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { incidents: rtIncidents, setIncidents, connected, demoMode } = useRealtime();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    listIncidents()
      .then((data) => setIncidents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const incidents = rtIncidents;
  const resolved = incidents.filter((i) => i.status === 'resolved');
  const active = incidents.filter((i) => i.status !== 'resolved');
  const avgMttr = resolved.length
    ? Math.round(resolved.reduce((s, i) => s + (i.mttr_seconds || 0), 0) / resolved.length)
    : 0;
  const avgMttrFmt = avgMttr ? `${Math.floor(avgMttr / 60)}m ${avgMttr % 60}s` : '—';
  const fixRate = incidents.length ? Math.round((resolved.length / incidents.length) * 100) : 0;

  // Filter logic
  const filteredIncidents = incidents.filter((i) => {
    const matchesSearch =
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.service.toLowerCase().includes(search.toLowerCase()) ||
      (i.root_cause && i.root_cause.toLowerCase().includes(search.toLowerCase()));

    const matchesService = serviceFilter === 'ALL' || i.service === serviceFilter;
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? i.status !== 'resolved'
        : i.status === 'resolved';

    return matchesSearch && matchesService && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 pb-16">
      
      {/* Top Header Hub */}
      <div className="bg-white border-b border-zinc-200 px-6 py-6 sticky top-[65px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1">
              <Link to="/" className="hover:text-black transition-colors">Overview</Link>
              <span>/</span>
              <span className="text-black font-extrabold">Autonomous Console</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 flex items-center gap-3">
              <span>SRE Operations Command Center</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700">
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 live-dot' : 'bg-rose-500'}`} />
              {connected ? 'SSE ACTIVE' : 'OFFLINE'}
            </span>
            {demoMode && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                🎭 DEMO MODE
              </span>
            )}
            <ChaosButton />
          </div>
        </div>
      </div>

      {/* Stat Cards Section */}
      <div className="px-6 py-6 border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="🚨" label="Total Incidents" value={incidents.length} subtext="Tracked" />
          <StatCard icon="✅" label="Auto-Resolved" value={resolved.length} subtext="Hindsight Memories" />
          <StatCard icon="⏱️" label="Average MTTR" value={avgMttrFmt} subtext="With Persistent Memory" />
          <StatCard icon="📊" label="Success Rate" value={incidents.length ? `${fixRate}%` : '—'} subtext="Playbook Accuracy" />
        </div>
      </div>

      {/* Active Anomaly Banner */}
      {active.length > 0 && (
        <div className="px-6 py-3.5 bg-rose-50 border-b border-rose-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm text-rose-950 font-bold">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              <span>
                <strong>{active.length}</strong> active incident{active.length !== 1 ? 's' : ''} under autonomous diagnosis & memory recall.
              </span>
            </div>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className="text-xs font-black underline hover:text-rose-700"
            >
              Filter Active &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight">
              Telemetry Anomaly Feed
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live anomaly stream, GPT-4o root-cause diagnosis, and persistent Hindsight memory hits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search incidents, logs or causes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs px-4 py-2 rounded-full border border-zinc-200 bg-white text-black placeholder-zinc-400 focus:outline-none focus:border-black w-52 sm:w-64 shadow-xs"
            />

            {/* Service filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-full border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-black shadow-xs"
            >
              <option value="ALL">All Services</option>
              <option value="payment-api">payment-api</option>
              <option value="auth-service">auth-service</option>
              <option value="orders-api">orders-api</option>
            </select>

            {/* Status tabs */}
            <div className="flex rounded-full bg-zinc-100 border border-zinc-200 p-1 text-xs font-bold">
              {['ALL', 'ACTIVE', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full transition-all ${
                    statusFilter === st ? 'bg-black text-white shadow-sm font-extrabold' : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 cw-card">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-black border-t-transparent mb-3" />
            <p className="text-xs font-bold text-zinc-500">Connecting to realtime telemetry node...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="cw-card p-16 text-center">
            <p className="text-5xl mb-4">🏖️</p>
            <p className="text-xl font-black text-black mb-2">Fleet operating normally</p>
            <p className="text-xs text-zinc-500 mb-6 max-w-md mx-auto">
              No active anomalies detected. Trigger a chaos failure scenario below to test vector memory.
            </p>
            <ChaosButton />
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="cw-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs font-extrabold uppercase tracking-wider">
                      {['Severity', 'Service', 'Incident Title & AI Diagnosis', 'Status', 'Confidence', 'MTTR', 'Triggered'].map((h) => (
                        <th key={h} className="px-5 py-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredIncidents.map((inc) => (
                      <tr
                        key={inc.id}
                        id={`incident-row-${inc.id}`}
                        className="inc-row"
                        onClick={() => navigate(`/incident/${inc.id}`)}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`${SEV[inc.severity] || 'sev-4'} text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider`}>
                            {inc.severity || 'SEV-4'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="mono text-xs font-extrabold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200">
                            {inc.service}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-md">
                          <p className="font-extrabold text-black truncate hover:underline">
                            {inc.title}
                          </p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {inc.root_cause || 'AI Agent analyzing logs, traces and vector memory...'}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`${ST[inc.status] || 'st-open'} text-xs font-bold px-3 py-1 rounded-full`}>
                            {ST_LABEL[inc.status] || inc.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {inc.confidence_score ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${inc.confidence_score}%`,
                                    background: inc.confidence_score >= 75 ? '#15803d' : inc.confidence_score >= 50 ? '#d97706' : '#dc2626',
                                  }}
                                />
                              </div>
                              <span className="mono text-xs font-extrabold text-zinc-700">{Math.round(inc.confidence_score)}%</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 mono text-xs font-extrabold text-zinc-800 whitespace-nowrap">
                          {inc.mttr_seconds ? (
                            <span className="text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              ⚡ {Math.floor(inc.mttr_seconds / 60)}m {inc.mttr_seconds % 60}s
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-zinc-500 whitespace-nowrap">
                          {timeAgo(inc.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Microservice Fleet Status Grid */}
            <div className="mt-10">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-4">
                Microservice Fleet Health
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['payment-api', 'auth-service', 'orders-api'].map((svc) => {
                  const svcIncidents = incidents.filter((i) => i.service === svc);
                  const hasActive = svcIncidents.some((i) => i.status !== 'resolved');
                  const latestSev = svcIncidents[0]?.severity;
                  const statusColor = hasActive ? (latestSev === 'SEV-1' ? '#dc2626' : '#ea580c') : '#15803d';

                  return (
                    <div
                      key={svc}
                      className="cw-card p-5 cursor-pointer"
                      onClick={() => {
                        const first = incidents.find((i) => i.service === svc);
                        if (first) navigate(`/incident/${first.id}`);
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="mono text-xs font-extrabold text-black bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
                          {svc}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${hasActive ? 'live-dot' : ''}`} style={{ background: statusColor }} />
                          <span className="text-xs font-black uppercase tracking-wide" style={{ color: statusColor }}>
                            {hasActive ? latestSev || 'Degraded' : 'Operational'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {svcIncidents.length} total incident{svcIncidents.length !== 1 ? 's' : ''} tracked &bull; {svcIncidents.filter((i) => i.status === 'resolved').length} auto-healed
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
