import { useEffect, useState } from 'react';
import { getIncidentLogs, getIncidentMetrics } from '../lib/api';

// ─── Metric Gauge ─────────────────────────────────────────────────────────────
function MetricGauge({ label, value, unit, max, color, icon }) {
  const pct = Math.min(100, (value / max) * 100);
  const isHigh = pct > 70;
  const activeColor = isHigh ? '#f43f5e' : color;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400">{icon} {label}</span>
        <span className="mono text-sm font-extrabold" style={{ color: activeColor }}>
          {value}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-slate-950 border border-slate-800">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: activeColor, boxShadow: `0 0 8px ${activeColor}` }}
        />
      </div>
    </div>
  );
}

export function MetricsPanel({ incidentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIncidentMetrics(incidentId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (loading) return (
    <div className="flex items-center justify-center h-28">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-400 border-t-transparent" />
    </div>
  );

  if (!data) return null;
  const m = data.metrics || {};
  const deploys = data.deploys || [];

  return (
    <div className="space-y-5">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">📊 Telemetry Metrics & Correlation</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricGauge label="p99 Latency" value={m.p99 || 0} unit="ms" max={5000} color="#06b6d4" icon="⚡" />
        <MetricGauge label="Error Rate" value={m.error_rate || 0} unit="%" max={100} color="#f97316" icon="❌" />
        <MetricGauge label="CPU Utilization" value={m.cpu || 0} unit="%" max={100} color="#10b981" icon="🖥️" />
        <MetricGauge label="Memory Heap" value={m.memory || 0} unit="%" max={100} color="#a855f7" icon="🧠" />
        <MetricGauge label="DB Pool Saturation" value={m.db_pool_usage || 0} unit="%" max={100} color="#f59e0b" icon="🗄️" />
        <MetricGauge label="Throughput" value={m.throughput || 0} unit=" rps" max={2000} color="#10b981" icon="📈" />
      </div>

      {deploys.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">🚀 Correlated Deploy Timeline</div>
          <div className="space-y-2">
            {deploys.slice(0, 3).map((d, i) => (
              <div key={i} className="rounded-xl p-3 bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="mono text-xs font-bold text-emerald-400">{d.version}</span>
                  <span className="text-[10px] text-slate-500">{new Date(d.deployed_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-slate-300">{d.changes_summary}</p>
                <p className="text-[11px] text-slate-500 mt-1">Deployed by {d.author}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Terminal Logs Viewer ───────────────────────────────────────────────────────
export function LogsViewer({ incidentId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    getIncidentLogs(incidentId)
      .then((d) => setLogs(d.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [incidentId]);

  function logClass(line) {
    if (line.includes(' ERROR ')) return 'text-rose-400 bg-rose-950/40';
    if (line.includes(' WARN ')) return 'text-amber-400 bg-amber-950/40';
    if (line.includes(' DEBUG ')) return 'text-slate-500';
    return 'text-slate-300';
  }

  const filtered = logs.filter((l) => {
    if (filter === 'ALL') return true;
    return l.includes(` ${filter} `);
  });

  const counts = {
    ERROR: logs.filter((l) => l.includes(' ERROR ')).length,
    WARN:  logs.filter((l) => l.includes(' WARN ')).length,
    INFO:  logs.filter((l) => !l.includes(' ERROR ') && !l.includes(' WARN ')).length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-28">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-400 border-t-transparent" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">📝 Service Log Stream</div>
        <div className="flex gap-1">
          {['ALL', 'ERROR', 'WARN', 'INFO'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                filter === f
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f} {f !== 'ALL' && counts[f] ? <span className="ml-0.5 text-[10px]">({counts[f]})</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden bg-[#030712] border border-slate-800 shadow-inner">
        <div className="max-h-64 overflow-y-auto p-3.5 space-y-1 font-mono text-xs">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No matching {filter} stream records</p>
          ) : (
            filtered.map((line, i) => (
              <div key={i} className={`py-0.5 px-2 rounded ${logClass(line)} leading-relaxed`}>{line}</div>
            ))
          )}
        </div>
      </div>
      <p className="text-[11px] mt-2 text-slate-500 font-mono">
        Showing {filtered.length} of {logs.length} stream lines &bull; Errors: <span className="text-rose-400 font-bold">{counts.ERROR}</span> &bull; Warnings: <span className="text-amber-400 font-bold">{counts.WARN}</span>
      </p>
    </div>
  );
}
