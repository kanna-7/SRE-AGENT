/**
 * In-Memory Demo Store
 * Replaces Supabase when DEMO_MODE=true
 * Full CRUD + realtime simulation via SSE
 */

import { EventEmitter } from 'events';

export const emitter = new EventEmitter();

let incidents = [];
let fixes = [];
let timelineEvents = [];

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const db = {
  // ─── Incidents ──────────────────────────────────────────────────
  createIncident(data) {
    const incident = {
      id: uuid(),
      created_at: new Date().toISOString(),
      resolved_at: null,
      status: 'open',
      severity: 'SEV-2',
      confidence_score: 0,
      root_cause: null,
      recommended_fix: null,
      blast_radius: null,
      mttr_seconds: null,
      symptoms: {},
      ...data,
    };
    incidents.unshift(incident);
    emitter.emit('incident:insert', incident);
    return incident;
  },

  updateIncident(id, data) {
    const idx = incidents.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    incidents[idx] = { ...incidents[idx], ...data };
    emitter.emit('incident:update', incidents[idx]);
    return incidents[idx];
  },

  getIncident(id) {
    return incidents.find((i) => i.id === id) || null;
  },

  listIncidents(limit = 50) {
    return incidents.slice(0, limit);
  },

  // ─── Fixes ──────────────────────────────────────────────────────
  createFix(data) {
    const fix = {
      id: uuid(),
      applied_at: new Date().toISOString(),
      success: null,
      side_effects: null,
      ...data,
    };
    fixes.push(fix);
    return fix;
  },

  updateFix(id, data) {
    const idx = fixes.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    fixes[idx] = { ...fixes[idx], ...data };
    return fixes[idx];
  },

  getLatestFix(incidentId) {
    return fixes
      .filter((f) => f.incident_id === incidentId)
      .sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at))[0] || null;
  },

  listFixes(incidentId) {
    return fixes.filter((f) => f.incident_id === incidentId);
  },

  // ─── Timeline Events ─────────────────────────────────────────────
  createTimelineEvent(data) {
    const event = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      raw_data: null,
      ...data,
    };
    timelineEvents.push(event);
    emitter.emit('timeline:insert', event);
    return event;
  },

  getTimeline(incidentId) {
    return timelineEvents
      .filter((e) => e.incident_id === incidentId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  // ─── Stats ───────────────────────────────────────────────────────
  getStats() {
    const resolved = incidents.filter((i) => i.status === 'resolved');
    const avgMttr = resolved.length
      ? Math.round(resolved.reduce((s, i) => s + (i.mttr_seconds || 0), 0) / resolved.length)
      : 0;
    return {
      total: incidents.length,
      resolved: resolved.length,
      open: incidents.filter((i) => i.status === 'open').length,
      diagnosing: incidents.filter((i) => i.status === 'diagnosing').length,
      avgMttr,
    };
  },

  // ─── Seed Data ───────────────────────────────────────────────────
  seed() {
    if (incidents.length > 0) return;

    const now = Date.now();
    const services = ['payment-api', 'auth-service', 'orders-api'];
    const scenarios = [
      {
        title: 'DB pool exhaustion on payment-api',
        severity: 'SEV-1',
        service: 'payment-api',
        root_cause: 'Recent deploy (v2.3.1) reduced DB connection pool from 50 → 10. Under normal traffic (890 rps), pool saturated within 4 minutes of deployment.',
        recommended_fix: 'Increase HikariCP pool size: hikari.maximum-pool-size=50. Rollback deploy v2.3.1 if pool resize not possible.',
        confidence_score: 92,
        blast_radius: 'All payment processing down. ~35% users affected. ETA recovery: 3-5 min after fix.',
        status: 'resolved',
        mttr_seconds: 263,
        symptoms: { error_rate_spike: true, p99_latency: '>4s', log_pattern: 'HikariPool' },
        created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        resolved_at: new Date(now - 2.9 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Memory leak detected on auth-service',
        severity: 'SEV-2',
        service: 'auth-service',
        root_cause: 'JWT token cache growing unbounded. Missing TTL configuration in cache-manager v4 upgrade.',
        recommended_fix: 'Set cache TTL: cache.ttl=3600. Rolling restart of auth-service pods.',
        confidence_score: 78,
        blast_radius: 'Login slow for ~8% users. Service degraded but not down.',
        status: 'diagnosing',
        mttr_seconds: null,
        symptoms: { memory_growth: true, oom_risk: true },
        created_at: new Date(now - 45 * 60 * 1000).toISOString(),
        resolved_at: null,
      },
      {
        title: 'Bad deployment causing 5xx errors on orders-api',
        severity: 'SEV-2',
        service: 'orders-api',
        root_cause: 'Deploy v1.9.2 introduced null pointer in order validation. Affects all POST /orders requests.',
        recommended_fix: 'Rollback to v1.9.1: kubectl rollout undo deployment/orders-api',
        confidence_score: 95,
        blast_radius: 'Order creation failing for 100% users. Read operations unaffected.',
        status: 'resolved',
        mttr_seconds: 87,
        symptoms: { recent_deploy: true, error_rate_spike: true },
        created_at: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
        resolved_at: new Date(now - 5.9 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const s of scenarios) {
      const inc = db.createIncident(s);

      // Timeline events for each
      db.createTimelineEvent({
        incident_id: inc.id,
        event_type: 'alert',
        description: `🚨 ${s.service} alert fired`,
        timestamp: new Date(new Date(s.created_at).getTime() + 0).toISOString(),
      });
      db.createTimelineEvent({
        incident_id: inc.id,
        event_type: 'ai_diagnosis',
        description: `AI diagnosis: ${s.root_cause?.slice(0, 80)}...`,
        timestamp: new Date(new Date(s.created_at).getTime() + 90000).toISOString(),
      });
      if (s.status === 'resolved') {
        db.createTimelineEvent({
          incident_id: inc.id,
          event_type: 'human_action',
          description: `oncall@company.com approved fix`,
          timestamp: new Date(new Date(s.created_at).getTime() + 120000).toISOString(),
        });
        db.createTimelineEvent({
          incident_id: inc.id,
          event_type: 'resolution',
          description: `Recovered in ${s.mttr_seconds}s`,
          timestamp: new Date(s.resolved_at).toISOString(),
        });
        db.createFix({
          incident_id: inc.id,
          action: s.recommended_fix,
          success: true,
          side_effects: null,
        });
      }
    }

    console.log(`[DEMO] Seeded ${incidents.length} incidents`);
  },
};
