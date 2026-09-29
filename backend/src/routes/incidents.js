import express from 'express';
import { db } from '../store.js';
import { mockTriageAlert, mockDiagnoseIncident, mockPostmortem } from '../mockAI.js';
import { getLogs } from '../tools/getLogs.js';
import { getRecentDeploys } from '../tools/getDeploys.js';
import { getMetrics } from '../tools/getMetrics.js';

const router = express.Router();

const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key';

// Helper: real OpenAI or mock
async function aiTriageAlert(alert) {
  if (DEMO_MODE) return mockTriageAlert(alert);
  const { triageAlert } = await import('../agents/triage.js');
  return triageAlert(alert);
}

async function aiDiagnoseIncident(incident, memories = []) {
  if (DEMO_MODE) return mockDiagnoseIncident(incident, memories);
  const { diagnoseIncident } = await import('../agents/diagnose.js');
  return diagnoseIncident(incident);
}

// ─── GET / ── List all incidents ──────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const incidents = db.listIncidents();
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /stats ───────────────────────────────────────────────────────────────
router.get('/stats/summary', (req, res) => {
  res.json(db.getStats());
});

// ─── GET /:id ── Single incident ──────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const incident = db.getIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    const timeline = db.getTimeline(req.params.id);
    const fixes = db.listFixes(req.params.id);
    res.json({ incident, timeline, fixes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /:id/approve ── Approve & execute fix ───────────────────────────────
router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { action, approvedBy = 'oncall@company.com' } = req.body;

  try {
    // Create fix record
    const fix = db.createFix({ incident_id: id, action });

    // Human action event
    db.createTimelineEvent({
      incident_id: id,
      event_type: 'human_action',
      description: `${approvedBy} approved: ${action}`,
    });

    // Remediating state
    db.updateIncident(id, { status: 'remediating' });

    // Fast simulation execution (200ms)
    await new Promise((r) => setTimeout(r, 200));

    const success = Math.random() < 0.95;
    const side_effects = success ? null : 'Temporary latency spike during restart (~10s)';
    db.updateFix(fix.id, { success, side_effects });

    // Fast recovery verification (300ms)
    await new Promise((r) => setTimeout(r, 300));

    const incident = db.getIncident(id);
    const mttr_seconds = Math.round((Date.now() - new Date(incident.created_at)) / 1000);

    db.updateIncident(id, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      mttr_seconds,
    });

    db.createTimelineEvent({
      incident_id: id,
      event_type: 'resolution',
      description: `✅ Recovered in ${Math.round(mttr_seconds / 60)}m ${mttr_seconds % 60}s`,
    });

    res.json({
      remediation: { success, side_effects, action },
      recovery: { recovered: true, mttr_seconds },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /:id/similar ── Hindsight memory recall ──────────────────────────────
router.get('/:id/similar', async (req, res) => {
  try {
    const incident = db.getIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Not found' });

    // In demo mode: return pre-built similar incidents
    const resolved = db.listIncidents().filter(
      (i) => i.status === 'resolved' && i.id !== req.params.id && i.service === incident.service
    );

    const memories = resolved.slice(0, 5).map((i) => ({
      id: i.id,
      content: `Incident on ${i.service}: ${i.title}. Severity ${i.severity}. Root cause: ${i.root_cause}. Fix applied: ${i.recommended_fix}. Success: true. MTTR: ${i.mttr_seconds}s.`,
      timestamp: i.created_at,
      metadata: { incident_id: i.id, service: i.service, success: true },
    }));

    res.json({ memories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /:id/postmortem ── AI postmortem ─────────────────────────────────────
router.get('/:id/postmortem', async (req, res) => {
  try {
    const incident = db.getIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Not found' });
    const timeline = db.getTimeline(req.params.id);
    const fixes = db.listFixes(req.params.id);

    let memories = [];
    try {
      const simRes = await fetch(`http://localhost:${process.env.PORT || 3001}/api/incidents/${req.params.id}/similar`);
      const simData = await simRes.json();
      memories = simData.memories || [];
    } catch (_) {}

    let markdown;
    if (DEMO_MODE) {
      markdown = mockPostmortem(incident, timeline, fixes, memories);
    } else {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const r = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You write blameless postmortems. Generate structured markdown with: ## Summary, ## Impact, ## Timeline, ## Root Cause, ## Resolution, ## What Went Well, ## Action Items (3-5), ## Related Incidents.' },
          { role: 'user', content: JSON.stringify({ incident, timeline, fixes, memories }) },
        ],
      });
      markdown = r.choices[0].message.content;
    }

    res.json({ markdown, incident, related: memories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /:id/logs ── Live observability data ─────────────────────────────────
router.get('/:id/logs', async (req, res) => {
  try {
    const incident = db.getIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Not found' });
    const logs = await getLogs(incident.service, incident.symptoms);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /:id/metrics ── Service metrics ─────────────────────────────────────
router.get('/:id/metrics', async (req, res) => {
  try {
    const incident = db.getIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Not found' });
    const [metrics, deploys] = await Promise.all([
      getMetrics(incident.service),
      getRecentDeploys(incident.service),
    ]);
    res.json({ metrics, deploys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
