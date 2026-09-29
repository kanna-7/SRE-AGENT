import { useEffect, useRef, useState } from 'react';
import { useRealtime } from '../lib/realtime';
import { getIncident } from '../lib/api';

const EVENT_ICONS = {
  alert: '🚨', deploy: '🚀', log: '📝', metric: '📊',
  ai_diagnosis: '🤖', human_action: '👤', resolution: '✅',
};

const EVENT_BG = {
  alert: 'rgba(244, 63, 94, 0.1)',
  deploy: 'rgba(30, 41, 59, 0.6)',
  log: 'rgba(30, 41, 59, 0.6)',
  metric: 'rgba(6, 182, 212, 0.1)',
  ai_diagnosis: 'rgba(16, 185, 129, 0.12)',
  human_action: 'rgba(245, 158, 11, 0.12)',
  resolution: 'rgba(16, 185, 129, 0.15)',
};

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function IncidentTimeline({ incidentId }) {
  const { timelineMap, mergeTimeline } = useRealtime();
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState(new Set());
  const bottomRef = useRef(null);

  const events = timelineMap[incidentId] || [];

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const data = await getIncident(incidentId);
        mergeTimeline(incidentId, data.timeline || []);
      } catch (err) {
        console.error('Timeline error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [incidentId]);

  // Track new events for animation
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (events.length > prevCountRef.current) {
      const latestEvents = events.slice(prevCountRef.current);
      setNewIds((prev) => new Set([...prev, ...latestEvents.map((e) => e.id)]));
      setTimeout(() => setNewIds(new Set()), 2000);
    }
    prevCountRef.current = events.length;
  }, [events.length]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">📋 Real-Time Timeline Stream</span>
        <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          {events.length} events
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-emerald-400 border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-slate-500">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-xs font-mono">Listening for live telemetry stream...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[600px]">
          {events.map((event) => (
            <div
              key={event.id}
              className={`flex gap-3 p-3 rounded-xl border border-slate-800 transition-all duration-300 ${
                newIds.has(event.id) ? 'ring-2 ring-emerald-400 bg-emerald-950/40' : ''
              }`}
              style={{ background: EVENT_BG[event.event_type] || 'rgba(30, 41, 59, 0.6)' }}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-sm">
                {EVENT_ICONS[event.event_type] || '📌'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="mono text-[10px] text-slate-400 font-semibold mb-0.5">
                  {formatTime(event.timestamp)}
                </p>
                <p className="text-xs font-medium leading-snug break-words text-slate-200">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
