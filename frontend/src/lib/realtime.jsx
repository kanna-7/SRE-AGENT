/**
 * SSE-based realtime store — replaces Supabase in demo mode
 * Falls back gracefully if SSE isn't available
 */

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const [incidents, setIncidents] = useState([]);
  const [timelineMap, setTimelineMap] = useState({}); // incidentId -> events[]
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const esRef = useRef(null);

  // Connect to SSE
  useEffect(() => {
    function connect() {
      const es = new EventSource(`${API}/api/events`);
      esRef.current = es;

      es.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        setConnected(true);
        setDemoMode(data.demo);
      });

      es.addEventListener('incident:insert', (e) => {
        const inc = JSON.parse(e.data);
        setIncidents((prev) => {
          if (prev.find((i) => i.id === inc.id)) return prev;
          return [inc, ...prev];
        });
      });

      es.addEventListener('incident:update', (e) => {
        const inc = JSON.parse(e.data);
        setIncidents((prev) => prev.map((i) => (i.id === inc.id ? { ...i, ...inc } : i)));
      });

      es.addEventListener('timeline:insert', (e) => {
        const event = JSON.parse(e.data);
        setTimelineMap((prev) => {
          const existing = prev[event.incident_id] || [];
          if (existing.find((ev) => ev.id === event.id)) return prev;
          return {
            ...prev,
            [event.incident_id]: [...existing, event].sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            ),
          };
        });
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        setTimeout(connect, 500); // Super fast reconnect
      };
    }

    connect();
    return () => esRef.current?.close();
  }, []);

  const mergeTimeline = useCallback((incidentId, events) => {
    setTimelineMap((prev) => ({
      ...prev,
      [incidentId]: events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    }));
  }, []);

  return (
    <RealtimeContext.Provider value={{ incidents, setIncidents, timelineMap, mergeTimeline, connected, demoMode }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
