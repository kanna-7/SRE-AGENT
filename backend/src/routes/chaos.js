import express from 'express';
import { db } from '../store.js';
import { mockTriageAlert, mockDiagnoseIncident } from '../mockAI.js';

const router = express.Router();
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key';

const SCENARIO_TITLES = {
  db_pool_exhaustion: 'DB pool exhaustion',
  memory_leak: 'Memory leak detected',
  bad_deploy: 'Bad deployment causing errors',
  network_partition: 'Network partition affecting downstream',
};

const SCENARIO_SYMPTOMS = {
  db_pool_exhaustion: { error_rate_spike: true, p99_latency: '>4s', log_pattern: 'HikariPool', db_connections_exhausted: true },
  memory_leak: { memory_growth: true, oom_risk: true, gc_pressure: true, slow_response: true },
  bad_deploy: { recent_deploy: true, error_rate_spike: true, increased_5xx: true, rollback_candidate: true },
  network_partition: { timeouts: true, downstream_failures: true, connection_refused: true, circuit_breaker_open: true },
};

// POST /trigger ── Trigger chaos incident
router.post('/trigger', async (req, res) => {
  const { service = 'payment-api', scenario = 'db_pool_exhaustion' } = req.body;
  const title = `${SCENARIO_TITLES[scenario] || scenario} on ${service}`;
  const symptoms = SCENARIO_SYMPTOMS[scenario] || {};

  // Create incident
  const incident = db.createIncident({ title, service, severity: 'SEV-2', status: 'open', symptoms });

  // Initial alert event
  db.createTimelineEvent({
    incident_id: incident.id,
    event_type: 'alert',
    description: `🚨 ${service} monitoring alert: ${scenario.replace(/_/g, ' ')} detected`,
    raw_data: { service, scenario, symptoms },
  });

  // Return incident ID immediately
  res.json({ incidentId: incident.id, incident });

  // ── Background pipeline (non-blocking) ─────────────────────────────────────
  setImmediate(async () => {
    try {
      // Step 1: Triage (fast for responsiveness)
      await delay(200);
      const triage = DEMO_MODE
        ? mockTriageAlert({ service, title, raw_alert: symptoms })
        : await (await import('../agents/triage.js')).triageAlert({ service, title, raw_alert: symptoms });

      db.updateIncident(incident.id, { severity: triage.severity });
      db.createTimelineEvent({
        incident_id: incident.id,
        event_type: 'alert',
        description: `Triage complete: ${triage.severity} — ${triage.impact_summary} (~${triage.affected_users_percent}% users affected)`,
        raw_data: triage,
      });

      // Step 2: Gather observability data
      await delay(150);
      const { getLogs } = await import('../tools/getLogs.js');
      const { getRecentDeploys } = await import('../tools/getDeploys.js');
      const { getMetrics } = await import('../tools/getMetrics.js');

      const [logs, deploys, metrics] = await Promise.all([
        getLogs(service, symptoms),
        getRecentDeploys(service),
        getMetrics(service),
      ]);

      db.createTimelineEvent({
        incident_id: incident.id,
        event_type: 'deploy',
        description: `Recent deploys fetched: ${deploys.length} deployment(s) in last 30min. Latest: ${deploys[0]?.version || 'unknown'} by ${deploys[0]?.author || 'unknown'}`,
        raw_data: { deploys: deploys.slice(0, 3) },
      });

      await delay(100);
      db.createTimelineEvent({
        incident_id: incident.id,
        event_type: 'log',
        description: `Log analysis complete: ${logs.filter(l => l.includes('ERROR')).length} ERROR lines, ${logs.filter(l => l.includes('WARN')).length} WARN lines in last 15min`,
        raw_data: { sample_logs: logs.slice(0, 5) },
      });

      await delay(100);
      db.createTimelineEvent({
        incident_id: incident.id,
        event_type: 'metric',
        description: `Metrics: p99=${metrics.p99}ms | error_rate=${metrics.error_rate}% | DB pool=${metrics.db_pool_usage}% | CPU=${metrics.cpu}%`,
        raw_data: metrics,
      });

      // Step 3: Recall similar past incidents
      await delay(150);
      const resolvedSimilar = db.listIncidents().filter(
        (i) => i.status === 'resolved' && i.id !== incident.id && i.service === service
      );
      const pastMemories = resolvedSimilar.slice(0, 3).map((i) => ({
        id: i.id,
        content: `Incident on ${i.service}: ${i.title}. Root cause: ${i.root_cause}. Fix: ${i.recommended_fix}. MTTR: ${i.mttr_seconds}s.`,
      }));

      if (pastMemories.length > 0) {
        db.createTimelineEvent({
          incident_id: incident.id,
          event_type: 'ai_diagnosis',
          description: `🧠 Hindsight memory: ${pastMemories.length} similar past incident(s) recalled. Confidence boosted +10%`,
          raw_data: { memories: pastMemories },
        });
      }

      // Step 4: Diagnose
      await delay(200);
      const updatedIncident = { ...incident, severity: triage.severity, symptoms };
      const diagnosis = DEMO_MODE
        ? mockDiagnoseIncident(updatedIncident, pastMemories)
        : await (await import('../agents/diagnose.js')).diagnoseIncident(updatedIncident);

      db.updateIncident(incident.id, {
        status: 'diagnosing',
        root_cause: diagnosis.root_cause,
        confidence_score: diagnosis.confidence_score,
        recommended_fix: diagnosis.recommended_fix,
        blast_radius: diagnosis.blast_radius,
      });

      db.createTimelineEvent({
        incident_id: incident.id,
        event_type: 'ai_diagnosis',
        description: `🤖 AI diagnosis complete (confidence: ${diagnosis.confidence_score}%): ${diagnosis.root_cause?.slice(0, 100)}...`,
        raw_data: {
          confidence_score: diagnosis.confidence_score,
          evidence: diagnosis.evidence,
          recommended_fix: diagnosis.recommended_fix,
          blast_radius: diagnosis.blast_radius,
        },
      });

    } catch (bgErr) {
      console.error('[CHAOS BG ERROR]', bgErr.message);
      db.createTimelineEvent({
        incident_id: incident.id,
        event_type: 'log',
        description: `⚠️ Background pipeline error: ${bgErr.message}`,
      });
    }
  });
});

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default router;
