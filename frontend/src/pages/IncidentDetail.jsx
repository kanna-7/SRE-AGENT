import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRealtime } from '../lib/realtime';
import { getIncident, getSimilarIncidents, approveFix } from '../lib/api';
import IncidentTimeline from '../components/IncidentTimeline';
import RootCauseCard from '../components/RootCauseCard';
import FixConfidence from '../components/FixConfidence';
import PostmortemView from '../components/PostmortemView';
import { MetricsPanel, LogsViewer } from '../components/ObservabilityPanel';

const SEV_STYLE = { 'SEV-1': 'sev-1', 'SEV-2': 'sev-2', 'SEV-3': 'sev-3', 'SEV-4': 'sev-4' };
const SEV_COLOR = { 'SEV-1': '#dc2626', 'SEV-2': '#ea580c', 'SEV-3': '#ca8a04', 'SEV-4': '#52525b' };
const ST_STYLE  = { open: 'st-open', diagnosing: 'st-diagnosing', remediating: 'st-remediating', resolved: 'st-resolved' };

const TABS = [
  { id: 'diagnosis', label: '🔍 AI Diagnosis & Memory' },
  { id: 'observability', label: '📊 Metrics & Logs' },
  { id: 'postmortem', label: '📄 Postmortem Report', resolvedOnly: true },
];

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { incidents: rtIncidents, mergeTimeline } = useRealtime();

  const [localIncident, setLocalIncident] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [approveState, setApproveState] = useState(''); // '' | 'loading' | 'executing' | 'done'

  // Merge realtime updates
  const rtIncident = rtIncidents.find((i) => i.id === id);
  const incident = rtIncident || localIncident;

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getIncident(id);
        setLocalIncident(data.incident);
        mergeTimeline(id, data.timeline || []);

        const sim = await getSimilarIncidents(id).catch(() => ({ memories: [] }));
        setMemories(sim.memories || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (incident?.status === 'resolved' && activeTab === 'diagnosis') {
      setTimeout(() => setApproveState('done'), 200);
    }
  }, [incident?.status]);

  async function handleApprove() {
    if (!incident?.recommended_fix) return;
    setApproveState('loading');
    try {
      setApproveState('executing');
      await approveFix(id, incident.recommended_fix, 'oncall@company.com');
      setApproveState('done');
    } catch (err) {
      setError('Approval failed: ' + err.message);
      setApproveState('');
    }
  }

  const visibleTabs = TABS.filter((t) => !t.resolvedOnly || incident?.status === 'resolved');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 mx-auto mb-4 border-3 border-black border-t-transparent" />
          <p className="text-xs font-bold text-zinc-500">Loading incident telemetry & memory vectors...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-black font-extrabold mb-2">Incident Record Not Found</p>
        <p className="text-xs text-zinc-500 mb-6">{error || 'This incident record may have expired or was purged.'}</p>
        <button onClick={() => navigate('/console')} className="btn-black text-xs">
          &larr; Back to SRE Console
        </button>
      </div>
    );
  }

  const sevColor = SEV_COLOR[incident.severity] || '#52525b';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-5 font-mono">
        <Link to="/" className="hover:text-black transition-colors">Overview</Link>
        <span>/</span>
        <Link to="/console" className="hover:text-black transition-colors">Console</Link>
        <span>/</span>
        <span className="text-black font-bold">{incident.id.slice(0, 8)}</span>
      </div>

      {/* Incident Header Card */}
      <div className="cw-card p-6 mb-6" style={{ borderLeft: `5px solid ${sevColor}` }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`${SEV_STYLE[incident.severity] || 'sev-4'} text-[11px] font-extrabold px-3 py-1 rounded-full uppercase`}>
                {incident.severity}
              </span>
              <span className={`${ST_STYLE[incident.status] || 'st-open'} text-xs font-bold px-3 py-1 rounded-full`}>
                {incident.status?.toUpperCase()}
              </span>
              <span className="mono text-xs px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200 font-extrabold">
                {incident.service}
              </span>
              {incident.confidence_score > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full mono bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  🤖 {Math.round(incident.confidence_score)}% AI Confidence
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-black truncate">{incident.title}</h1>
            <p className="mono text-xs text-zinc-400 mt-1">Incident ID: {incident.id}</p>
          </div>

          <div className="text-right text-xs font-mono text-zinc-500">
            <div>Created: {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            {incident.resolved_at && (
              <div className="mt-1 font-bold text-emerald-700">
                ✅ Resolved: {new Date(incident.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {incident.mttr_seconds && (
              <div className="mono font-black text-emerald-700 text-sm mt-1">
                MTTR: {Math.floor(incident.mttr_seconds / 60)}m {incident.mttr_seconds % 60}s
              </div>
            )}
          </div>
        </div>

        {/* Blast radius info */}
        {incident.blast_radius && (
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-start gap-2 text-xs">
            <span className="text-amber-600 text-sm">⚠️</span>
            <span className="text-zinc-700">
              <strong className="text-black">Blast Radius Assessment:</strong> {incident.blast_radius}
            </span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200 pb-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
              activeTab === tab.id
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* DIAGNOSIS TAB */}
          {activeTab === 'diagnosis' && (
            <>
              <RootCauseCard
                rootCause={incident.root_cause}
                confidence={incident.confidence_score}
                evidence={incident.evidence || []}
              />

              <FixConfidence incidentId={id} recommendedFix={incident.recommended_fix} />

              {/* Approve Fix Button */}
              {incident.status === 'diagnosing' && (
                <div className="cw-card p-6">
                  <div className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-3">
                    🎯 Human-In-The-Loop Playbook Approval
                  </div>
                  <div className="rounded-2xl p-4 mb-4 bg-zinc-50 border border-zinc-200">
                    <p className="text-xs font-bold text-zinc-500 mb-1">Recommended Playbook Action:</p>
                    <p className="mono text-sm font-black text-zinc-900">{incident.recommended_fix}</p>
                  </div>
                  <button
                    id="approve-fix-btn"
                    onClick={handleApprove}
                    disabled={approveState !== ''}
                    className="w-full btn-black py-3.5 text-sm disabled:opacity-60"
                  >
                    {approveState === 'loading'    && '⚡ Initiating fix sequence...'}
                    {approveState === 'executing'  && '⚡ Applying remediation playbook...'}
                    {approveState === 'done'       && '✅ Fix Applied & Verified!'}
                    {!approveState                 && '✅ Approve & Execute Automated Fix'}
                  </button>
                </div>
              )}

              {/* Resolved notification */}
              {incident.status === 'resolved' && (
                <div className="cw-card p-5 border-emerald-300 bg-emerald-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✅</span>
                    <div>
                      <p className="font-extrabold text-black text-sm">Incident Auto-Resolved</p>
                      <p className="text-xs text-emerald-800 font-bold">
                        Recovered in {Math.floor(incident.mttr_seconds / 60)}m {incident.mttr_seconds % 60}s &bull; Postmortem report ready
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn-black text-xs py-2 px-4"
                    onClick={() => setActiveTab('postmortem')}
                  >
                    View Postmortem &rarr;
                  </button>
                </div>
              )}

              {/* Hindsight Vector Memory Matches */}
              <div className="cw-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧠</span>
                    <h3 className="font-extrabold text-black text-sm">Hindsight Vector Memory Matches</h3>
                  </div>
                  {memories.length > 0 && (
                    <span className="text-xs font-mono font-bold px-3 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                      {memories.length} historical matches
                    </span>
                  )}
                </div>

                {memories.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500">
                    <p className="text-xs font-mono">No prior identical incident patterns in memory cluster.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {memories.map((m, i) => (
                      <div key={i} className="rounded-2xl p-4 bg-zinc-50 border border-zinc-200">
                        <p className="text-xs font-extrabold text-black mb-1">Vector Memory Record #{i + 1}</p>
                        <p className="mono text-xs text-zinc-600 leading-relaxed">
                          {(m.content || '').slice(0, 200)}{m.content?.length > 200 ? '…' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* OBSERVABILITY TAB */}
          {activeTab === 'observability' && (
            <>
              <div className="cw-card p-6">
                <MetricsPanel incidentId={id} />
              </div>
              <div className="cw-card p-6">
                <LogsViewer incidentId={id} />
              </div>
            </>
          )}

          {/* POSTMORTEM TAB */}
          {activeTab === 'postmortem' && (
            <PostmortemView incidentId={id} />
          )}
        </div>

        {/* Right Column Timeline */}
        <div className="cw-card p-5 min-h-[500px]">
          <IncidentTimeline incidentId={id} />
        </div>
      </div>
    </div>
  );
}
