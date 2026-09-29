const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchJSON(url, options = {}) {
  const res = await fetch(`${API}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const listIncidents   = ()              => fetchJSON('/api/incidents');
export const getIncident     = (id)            => fetchJSON(`/api/incidents/${id}`);
export const approveFix      = (id, action, by) => fetchJSON(`/api/incidents/${id}/approve`, { method: 'POST', body: JSON.stringify({ action, approvedBy: by }) });
export const getSimilarIncidents = (id)        => fetchJSON(`/api/incidents/${id}/similar`);
export const getPostmortem   = (id)            => fetchJSON(`/api/incidents/${id}/postmortem`);
export const triggerChaos    = (service, scenario) => fetchJSON('/api/chaos/trigger', { method: 'POST', body: JSON.stringify({ service, scenario }) });
export const getStats        = ()              => fetchJSON('/api/stats');
export const getIncidentLogs = (id)            => fetchJSON(`/api/incidents/${id}/logs`);
export const getIncidentMetrics = (id)         => fetchJSON(`/api/incidents/${id}/metrics`);
export const healthCheck     = ()              => fetchJSON('/health');
