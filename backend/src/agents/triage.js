import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Triage an incoming alert and assign severity
 * @param {Object} alert - { service, title, raw_alert }
 */
export async function triageAlert(alert) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SRE triaging a production alert. Classify severity: SEV-1 (full outage, all users), SEV-2 (major feature down, >10% users), SEV-3 (degraded, <10% users), SEV-4 (cosmetic). Return JSON with keys: severity, impact_summary, affected_users_percent, priority (1-5).',
        },
        {
          role: 'user',
          content: `Service: ${alert.service}\nAlert Title: ${alert.title}\nRaw Alert: ${JSON.stringify(alert.raw_alert || {})}`,
        },
      ],
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed;
  } catch (err) {
    console.error('[TRIAGE ERROR]', err.message);
    return {
      severity: 'SEV-3',
      impact_summary: 'Unknown — triage failed',
      affected_users_percent: 0,
      priority: 3,
    };
  }
}
