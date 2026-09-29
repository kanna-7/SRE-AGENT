export default function RootCauseCard({ rootCause, confidence, evidence = [] }) {
  const n = Math.round(confidence || 0);
  const color = n >= 75 ? '#10b981' : n >= 50 ? '#f59e0b' : '#f43f5e';
  const label = n >= 75 ? 'High Confidence' : n >= 50 ? 'Medium Confidence' : 'Low Confidence';

  if (!rootCause) {
    return (
      <div className="cyber-card p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">🔍 Root Cause Synthesis</div>
        <div className="flex items-center gap-3 text-slate-400 font-mono text-xs">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-400 border-t-transparent" />
          <span>AI Agent is diagnosing... fetching logs, metric anomalies & Hindsight memory vectors</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">🔍 Root Cause Diagnosis</div>
        <span
          className="text-xs font-extrabold px-3 py-1 rounded-full"
          style={{ color, background: color + '20', border: `1px solid ${color}40` }}
        >
          {label}
        </span>
      </div>

      {/* Root cause summary */}
      <div className="rounded-xl p-4 mb-5 bg-slate-900/90 border border-slate-800">
        <p className="text-sm leading-relaxed text-slate-200 font-medium">{rootCause}</p>
      </div>

      {/* Confidence gauge */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-400 font-semibold">AI Confidence Level</span>
          <span className="mono font-extrabold text-lg" style={{ color }}>{n}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-slate-900 border border-slate-800">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${n}%`, background: color, boxShadow: `0 0 12px ${color}` }}
          />
        </div>
        {n >= 75 && (
          <p className="text-xs mt-2 font-bold text-emerald-400 flex items-center gap-1">
            <span>✓</span> High confidence threshold met &mdash; playbook safe for automated execution
          </p>
        )}
      </div>

      {/* Diagnostic telemetry evidence */}
      {evidence.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">📎 Correlated Diagnostic Telemetry</div>
          <div className="space-y-2">
            {evidence.map((item, i) => (
              <div key={i} className="flex gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-emerald-400 font-bold flex-shrink-0">▸</span>
                <span className="mono text-xs leading-relaxed text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
