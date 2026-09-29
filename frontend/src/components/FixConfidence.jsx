import { useEffect, useState } from 'react';
import { getSimilarIncidents } from '../lib/api';

export default function FixConfidence({ incidentId, recommendedFix }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSimilarIncidents(incidentId)
      .then((d) => setMemories(d.memories || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [incidentId]);

  const successCount = memories.filter((m) => (m.content || '').toLowerCase().includes('success: true')).length;
  const successRate = memories.length > 0 ? Math.round((successCount / memories.length) * 100) : null;
  const srColor = successRate >= 80 ? '#10b981' : successRate >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="cyber-card p-6">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">🔧 Recommended Playbook Action</div>

      {recommendedFix ? (
        <div className="rounded-xl p-4 mb-5 bg-emerald-950/40 border border-emerald-500/30">
          <p className="mono text-sm leading-relaxed text-emerald-300 font-bold">{recommendedFix}</p>
        </div>
      ) : (
        <div className="rounded-xl p-4 mb-5 bg-slate-900 border border-slate-800">
          <p className="text-sm text-slate-400 font-medium">Awaiting root cause synthesis...</p>
        </div>
      )}

      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">🧠 Hindsight Persistent Memory Validation</div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <div className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-emerald-400 border-t-transparent" />
          Cross-referencing vector embeddings with past resolutions...
        </div>
      ) : memories.length > 0 ? (
        <>
          <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <span className="text-3xl">📊</span>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold" style={{ color: srColor }}>{successRate}%</span>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Historical Playbook Success Rate</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified against {memories.length} historical vector incident match{memories.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {memories.slice(0, 3).map((m, i) => (
              <div key={i} className="rounded-xl p-3 bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-400 text-xs font-bold">Vector Memory Match #{i + 1}</span>
                  <span className="text-[10px] text-slate-500">&bull; {new Date(m.timestamp || Date.now()).toLocaleDateString()}</span>
                </div>
                <p className="mono text-xs text-slate-300 truncate">{m.content || 'Historical playbook execution record.'}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          No prior identical vector matches. This resolution will be indexed into persistent Hindsight memory upon recovery.
        </div>
      )}
    </div>
  );
}
