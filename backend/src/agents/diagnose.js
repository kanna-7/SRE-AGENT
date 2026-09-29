import OpenAI from 'openai';
import { recallSimilarIncidents, reflectOnFixes } from '../memory/hindsight.js';
import { getRecentDeploys } from '../tools/getDeploys.js';
import { getLogs } from '../tools/getLogs.js';
import { getMetrics } from '../tools/getMetrics.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Core AI diagnosis engine with Hindsight memory recall
 * @param {Object} incident - { id, service, symptoms, severity, title }
 */
export async function diagnoseIncident(incident) {
  try {
    // Step 1 — Parallel fetch of all signals + memory
    const [deploys, logs, metrics, pastIncidents, fixInsights] = await Promise.all([
      getRecentDeploys(incident.service),
      getLogs(incident.service, incident.symptoms),
      getMetrics(incident.service),
      recallSimilarIncidents(incident.symptoms, incident.service),
      reflectOnFixes(incident.service),
    ]);

    // Step 2 — Build memory context string
    let memoryContext = 'No similar past incidents found.';
    if (pastIncidents.length > 0) {
      memoryContext =
        'SIMILAR PAST INCIDENTS (Hindsight memory):\n' +
        pastIncidents.map((m, i) => `• [${i + 1}] ${m.content || JSON.stringify(m)}`).join('\n');
    }

    const fixInsightsText =
      fixInsights.reflection || fixInsights.content || 'No fix insights available yet.';

    // Step 3 — Call GPT-4o with memory-enhanced context
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a Senior SRE with deep memory of past incidents. Use FRESH SIGNALS for evidence and PAST INCIDENTS as learned experience. Return JSON with keys: root_cause (string, cite specific evidence), confidence_score (0-100 int), recommended_fix (string, a specific action/command), blast_radius (string, what will be affected + estimated recovery time), evidence (array of 3-5 strings), similar_past_incident_ids (array of referenced memory IDs).',
        },
        {
          role: 'user',
          content: `
INCIDENT:
- Service: ${incident.service}
- Severity: ${incident.severity}
- Title: ${incident.title}
- Symptoms: ${JSON.stringify(incident.symptoms)}

FRESH SIGNALS:
Recent Deploys: ${JSON.stringify(deploys, null, 2)}
Recent Logs (first 10): ${logs.slice(0, 10).join('\n')}
Metrics: ${JSON.stringify(metrics, null, 2)}

HINDSIGHT MEMORY:
${memoryContext}

Fix Insights: ${fixInsightsText}
          `.trim(),
        },
      ],
    });

    const diagnosis = JSON.parse(response.choices[0].message.content);

    // Step 4 — Boost confidence if we have past incidents (memory is valuable!)
    if (pastIncidents.length > 0) {
      diagnosis.confidence_score = Math.min(95, (diagnosis.confidence_score || 70) + 10);
    }

    // Step 5 — Return parsed result
    return {
      ...diagnosis,
      pastIncidents,
      deploys,
      metrics,
    };
  } catch (err) {
    console.error('[DIAGNOSE ERROR]', err.message);
    return {
      root_cause: 'Diagnosis failed — check API keys and connectivity',
      confidence_score: 10,
      recommended_fix: 'Manual investigation required',
      blast_radius: 'Unknown',
      evidence: ['Diagnosis service error: ' + err.message],
      similar_past_incident_ids: [],
      pastIncidents: [],
    };
  }
}
