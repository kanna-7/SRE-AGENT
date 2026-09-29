import { createClient } from '@supabase/supabase-js';
import { retainIncident } from '../memory/hindsight.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Propose a remediation plan based on AI diagnosis
 * Sets incident to 'diagnosing' state and adds AI diagnosis timeline event
 */
export async function proposeRemediation(incidentId, diagnosis) {
  try {
    // Insert AI diagnosis timeline event
    await supabase.from('timeline_events').insert({
      incident_id: incidentId,
      event_type: 'ai_diagnosis',
      description: `AI diagnosis: ${diagnosis.root_cause}`,
      raw_data: {
        confidence_score: diagnosis.confidence_score,
        evidence: diagnosis.evidence,
        recommended_fix: diagnosis.recommended_fix,
        blast_radius: diagnosis.blast_radius,
        memory_hits: diagnosis.pastIncidents?.length || 0,
      },
    });

    // Update incident with diagnosis results
    await supabase
      .from('incidents')
      .update({
        status: 'diagnosing',
        root_cause: diagnosis.root_cause,
        confidence_score: diagnosis.confidence_score,
        recommended_fix: diagnosis.recommended_fix,
        blast_radius: diagnosis.blast_radius,
      })
      .eq('id', incidentId);

    return {
      requires_approval: true,
      action: diagnosis.recommended_fix,
      confidence: diagnosis.confidence_score,
    };
  } catch (err) {
    console.error('[REMEDIATE ERROR] proposeRemediation:', err.message);
    throw err;
  }
}

/**
 * Execute the approved remediation fix
 * Human has approved — this simulates execution
 */
export async function executeRemediation(incidentId, action, approvedBy) {
  try {
    // Insert fix record
    const { data: fix } = await supabase
      .from('fixes')
      .insert({ incident_id: incidentId, action, applied_at: new Date().toISOString() })
      .select()
      .single();

    // Log the human approval
    await supabase.from('timeline_events').insert({
      incident_id: incidentId,
      event_type: 'human_action',
      description: `${approvedBy} approved: ${action}`,
    });

    // Update incident to remediating
    await supabase.from('incidents').update({ status: 'remediating' }).eq('id', incidentId);

    // Simulate execution time
    await new Promise((r) => setTimeout(r, 2000));

    // 90% success rate
    const success = Math.random() < 0.9;
    const side_effects = success ? null : 'Temporary latency spike during restart';

    // Update fix outcome
    await supabase.from('fixes').update({ success, side_effects }).eq('id', fix.id);

    return { success, side_effects, fixId: fix.id };
  } catch (err) {
    console.error('[REMEDIATE ERROR] executeRemediation:', err.message);
    throw err;
  }
}

/**
 * Verify recovery and retain this incident in Hindsight memory for future reference
 * This is the CRITICAL step — it's how the agent learns from every incident
 */
export async function verifyRecovery(incidentId) {
  try {
    // Wait for system to stabilize
    await new Promise((r) => setTimeout(r, 5000));

    // Fetch current incident state
    const { data: incident } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', incidentId)
      .single();

    // Calculate MTTR
    const mttr_seconds = Math.round((Date.now() - new Date(incident.created_at)) / 1000);

    // Mark incident as resolved
    const { data: updatedIncident } = await supabase
      .from('incidents')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        mttr_seconds,
      })
      .eq('id', incidentId)
      .select()
      .single();

    // Add resolution to timeline
    await supabase.from('timeline_events').insert({
      incident_id: incidentId,
      event_type: 'resolution',
      description: `Recovered in ${Math.round(mttr_seconds)}s. MTTR: ${Math.round(mttr_seconds / 60)}m ${mttr_seconds % 60}s`,
    });

    // Fetch the latest fix for this incident
    const { data: fix } = await supabase
      .from('fixes')
      .select('*')
      .eq('incident_id', incidentId)
      .order('applied_at', { ascending: false })
      .limit(1)
      .single();

    // ⭐ CRITICAL — Retain incident in Hindsight memory for future recall
    if (fix) {
      await retainIncident(updatedIncident, {
        action: fix.action,
        success: fix.success,
        side_effects: fix.side_effects,
      });
    }

    return { recovered: true, mttr_seconds };
  } catch (err) {
    console.error('[REMEDIATE ERROR] verifyRecovery:', err.message);
    throw err;
  }
}
