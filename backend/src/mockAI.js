/**
 * Mock AI Engine - produces realistic AI responses without OpenAI
 * Used when DEMO_MODE=true or OPENAI_API_KEY is missing/demo
 */

const DIAGNOSES = {
  db_pool_exhaustion: {
    root_cause:
      'Recent deployment (v2.3.1) reduced HikariCP connection pool size from 50 → 10. Under current traffic load (890 rps), the pool was exhausted within 4 minutes. DB pool utilization reached 100% causing all new requests to queue then timeout after 30s.',
    confidence_score: 89,
    recommended_fix:
      'Increase HikariCP pool: spring.datasource.hikari.maximum-pool-size=50. Then rolling restart. If urgent: kubectl rollout undo deployment/payment-api',
    blast_radius:
      'All payment processing requests failing. ~35% users cannot complete checkout. Estimated recovery: 3-5 min after pool resize + restart.',
    evidence: [
      'HikariPool-1 Connection not available, request timed out after 30000ms (47 occurrences in 15m)',
      'DB pool utilization: 100% active=10/10, idle=0, pending=83',
      'Deploy v2.3.1 (8 min ago) changed: "Reduced DB pool size 50 → 10"',
      'p99 latency spiked from 120ms → 4200ms exactly at deploy time',
      'Error rate: 0.2% → 12.4% correlated with deploy timestamp',
    ],
    similar_past_incident_ids: [],
  },
  memory_leak: {
    root_cause:
      'JWT token cache growing unbounded after cache-manager v4 upgrade removed default TTL. Cache entries accumulate in heap, triggering GC pressure every 45s.',
    confidence_score: 74,
    recommended_fix:
      'Set cache TTL: cache.ttl=3600. Deploy fix then rolling restart: kubectl rollout restart deployment/auth-service',
    blast_radius:
      'Auth service response time p99 degrading. Login slow for ~8% users (mainly during GC pauses). Service not down, but trending toward OOM in ~2hrs.',
    evidence: [
      'Heap memory growth: 2.1GB → 4.8GB over 3 hours (linear)',
      'GC pause duration: 850ms every 45s (threshold: 200ms)',
      'cache-manager upgraded v3 → v4 in deploy 6 hours ago',
      'cache.ttl config missing from application.yml (v4 no longer defaults TTL)',
      'JWT cache size: 2.3M entries (no eviction observed)',
    ],
    similar_past_incident_ids: [],
  },
  bad_deploy: {
    root_cause:
      'Deploy v1.9.2 introduced a null pointer exception in OrderValidator.validate() when orderItems list is empty. All POST /orders requests with empty cart fail with 500.',
    confidence_score: 95,
    recommended_fix:
      'Immediate rollback: kubectl rollout undo deployment/orders-api. Then hotfix: add null check in OrderValidator.java line 47.',
    blast_radius:
      'Order creation failing for 100% of users with empty cart edge case. Read operations (GET /orders) unaffected. Revenue impact: ~$12k/min.',
    evidence: [
      'Error rate jumped from 0.1% → 61% exactly at deploy v1.9.2 (11 min ago)',
      'NullPointerException at OrderValidator.validate():47 in every error trace',
      'All 500 errors on POST /orders (zero on GET /orders)',
      'Rollback to v1.9.1 would restore known-good state',
      'No infrastructure changes — code-only deploy',
    ],
    similar_past_incident_ids: [],
  },
  network_partition: {
    root_cause:
      'Network ACL rule update blocked inter-service communication between orders-api and payment-api subnets. Circuit breaker opened after 5 consecutive timeouts.',
    confidence_score: 81,
    recommended_fix:
      'Revert ACL change: aws ec2 revoke-security-group-ingress --group-id sg-xxx. Check network-team Slack #incidents for ACL change 20min ago.',
    blast_radius:
      'Checkout flow broken: orders-api cannot reach payment-api. All purchases failing. Pure network issue — no data corruption.',
    evidence: [
      'Circuit breaker OPEN for payment-api downstream calls (timeout after 5000ms)',
      'Network ACL modified 20 minutes ago (CloudTrail: network-automation@company.com)',
      'Direct ping payment-api from orders-api: 100% packet loss',
      'Payment-api itself healthy (internal health check green)',
      'No application deployments in last 2 hours',
    ],
    similar_past_incident_ids: [],
  },
};

const TRIAGE_RESULTS = {
  db_pool_exhaustion: { severity: 'SEV-1', impact_summary: 'Full payment processing outage. All users affected.', affected_users_percent: 100, priority: 1 },
  memory_leak: { severity: 'SEV-2', impact_summary: 'Auth service degraded. 8% users experiencing slow login.', affected_users_percent: 8, priority: 2 },
  bad_deploy: { severity: 'SEV-1', impact_summary: 'Order creation completely broken. Revenue impact ongoing.', affected_users_percent: 100, priority: 1 },
  network_partition: { severity: 'SEV-2', impact_summary: 'Checkout flow broken. Payment calls failing.', affected_users_percent: 60, priority: 2 },
};

export function mockTriageAlert(alert) {
  const scenario = detectScenario(alert);
  const result = TRIAGE_RESULTS[scenario] || {
    severity: 'SEV-3',
    impact_summary: 'Service degraded. Impact under investigation.',
    affected_users_percent: 15,
    priority: 3,
  };
  return result;
}

export function mockDiagnoseIncident(incident, pastMemories = []) {
  const scenario = detectScenario({ title: incident.title, symptoms: incident.symptoms });
  const base = DIAGNOSES[scenario] || DIAGNOSES.db_pool_exhaustion;
  const boost = pastMemories.length > 0 ? 10 : 0;
  return {
    ...base,
    confidence_score: Math.min(95, base.confidence_score + boost),
    pastIncidents: pastMemories,
    similar_past_incident_ids: pastMemories.map((m) => m.id || m).filter(Boolean),
  };
}

export function mockPostmortem(incident, timeline, fixes, memories) {
  const mttrMin = Math.round((incident.mttr_seconds || 300) / 60);
  const mttrSec = (incident.mttr_seconds || 300) % 60;

  return `## Summary

On ${new Date(incident.created_at).toUTCString()}, the **${incident.service}** service experienced a ${incident.severity} incident: "${incident.title}". The incident was detected automatically, triaged by the AI agent, diagnosed using historical memory, and resolved in **${mttrMin}m ${mttrSec}s**.

## Impact

- **Severity:** ${incident.severity}
- **Duration:** ${mttrMin} minutes ${mttrSec} seconds
- **Service:** ${incident.service}
- **Blast radius:** ${incident.blast_radius || 'Under investigation at time of writing.'}

## Timeline

${timeline.map((e) => `- **${new Date(e.timestamp).toLocaleTimeString()}** [${e.event_type}] ${e.description}`).join('\n')}

## Root Cause

${incident.root_cause || 'Root cause analysis was inconclusive.'}

## Resolution

${fixes.length > 0 ? fixes.map((f) => `Applied fix: \`${f.action}\`. Outcome: **${f.success ? 'Success' : 'Partial success'}**${f.side_effects ? `. Side effects: ${f.side_effects}` : ''}.`).join('\n') : 'Fix was applied and recovery verified automatically.'}

## What Went Well

- AI agent detected and diagnosed the incident without manual intervention
- Hindsight memory ${memories.length > 0 ? 'recalled similar past incidents, boosting confidence by +10%' : 'stored this incident for future recall'}
- MTTR of ${mttrMin}m ${mttrSec}s is within SLO targets
- Blameless investigation completed automatically

## Action Items

1. **Add canary deployment gate** — require p99 < 200ms before full rollout (owner: platform-team, due: +1 sprint)
2. **Create runbook** for ${incident.title} scenario and link in PagerDuty (owner: on-call rotation, due: +3 days)
3. **Add alerting** for early warning at 70% DB pool utilization (owner: observability-team, due: +1 week)
4. **Load test** next deploy in staging environment before production (owner: QA team, due: next release)
5. **Review** change management process for high-risk configuration changes (owner: engineering-manager, due: +2 weeks)

## Related Incidents

${memories.length > 0
  ? memories.map((m, i) => `- **Past Incident ${i + 1}:** ${(m.content || JSON.stringify(m)).slice(0, 150)}...`).join('\n')
  : '- No similar incidents found in Hindsight memory (this was a first occurrence).'}
`;
}

function detectScenario(alert) {
  const text = JSON.stringify({ ...alert }).toLowerCase();
  if (text.includes('pool') || text.includes('hikari') || text.includes('db_pool')) return 'db_pool_exhaustion';
  if (text.includes('memory') || text.includes('leak') || text.includes('oom')) return 'memory_leak';
  if (text.includes('deploy') || text.includes('bad_deploy') || text.includes('rollback')) return 'bad_deploy';
  if (text.includes('network') || text.includes('partition') || text.includes('timeout')) return 'network_partition';
  return 'db_pool_exhaustion';
}
