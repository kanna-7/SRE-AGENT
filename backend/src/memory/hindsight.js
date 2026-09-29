import axios from 'axios';

const API_URL = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';
const API_KEY = process.env.HINDSIGHT_API_KEY;

const hindsightClient = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Retain an incident resolution in Hindsight memory
 */
export async function retainIncident(incident, fixOutcome) {
  try {
    const { service, title, severity, symptoms, root_cause, mttr_seconds, id: incident_id } = incident;
    const content = `Incident on ${service}: ${title}. Severity ${severity}. Symptoms: ${JSON.stringify(symptoms)}. Root cause: ${root_cause}. Fix applied: ${fixOutcome.action}. Success: ${fixOutcome.success}. Side effects: ${fixOutcome.side_effects || 'none'}. MTTR: ${mttr_seconds}s.`;

    const response = await hindsightClient.post('/v1/retain', {
      bank_id: `sre-${service}`,
      content,
      context: 'incident_resolution',
      timestamp: new Date().toISOString(),
      metadata: { incident_id, service, success: fixOutcome.success },
    });

    return response.data;
  } catch (err) {
    console.error('[HINDSIGHT ERROR] retainIncident:', err.message);
    return null;
  }
}

/**
 * Recall similar past incidents from Hindsight memory
 */
export async function recallSimilarIncidents(symptoms, service) {
  try {
    const query = `Incident with symptoms: ${JSON.stringify(symptoms)} on service ${service}`;
    const response = await hindsightClient.post('/v1/recall', {
      bank_id: `sre-${service}`,
      query,
      limit: 5,
    });
    return response.data.memories || [];
  } catch (err) {
    console.error('[HINDSIGHT ERROR] recallSimilarIncidents:', err.message);
    return [];
  }
}

/**
 * Reflect on what fixes have worked best for a service
 */
export async function reflectOnFixes(service) {
  try {
    const response = await hindsightClient.post('/v1/reflect', {
      bank_id: `sre-${service}`,
      query: 'What fixes have worked best for incidents on this service?',
    });
    return response.data || {};
  } catch (err) {
    console.error('[HINDSIGHT ERROR] reflectOnFixes:', err.message);
    return {};
  }
}

/**
 * Store conversation messages in Hindsight memory
 */
export async function storeConversation(incidentId, messages) {
  try {
    const response = await hindsightClient.post('/v1/retain', {
      bank_id: 'sre-conversations',
      content: JSON.stringify(messages),
      context: 'incident_conversation',
      metadata: { incident_id: incidentId },
    });
    return response.data;
  } catch (err) {
    console.error('[HINDSIGHT ERROR] storeConversation:', err.message);
    return {};
  }
}
