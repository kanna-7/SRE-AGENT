/**
 * Mock Observability Tool: Application Logs
 * Returns realistic log patterns for DB pool exhaustion and other scenarios
 */

export async function getLogs(service, symptoms = {}, windowMinutes = 15) {
  const now = Date.now();
  const logs = [];

  const logTemplates = [
    // ERROR patterns - DB pool exhaustion
    { level: 'ERROR', msg: `[${service}] HikariPool-1 - Connection is not available, request timed out after 30000ms` },
    { level: 'ERROR', msg: `[${service}] HikariPool-1 - Connection is not available, request timed out after 30000ms` },
    { level: 'ERROR', msg: `[${service}] HikariPool-1 - Connection is not available, request timed out after 30000ms` },
    { level: 'ERROR', msg: `[${service}] SQLException: Unable to acquire JDBC Connection` },
    { level: 'ERROR', msg: `[${service}] CircuitBreaker OPEN for downstream call to database` },
    { level: 'ERROR', msg: `[${service}] Request failed after 3 retries: DB connection refused` },
    // WARN patterns
    { level: 'WARN', msg: `[${service}] DB pool utilization at 95%` },
    { level: 'WARN', msg: `[${service}] DB pool utilization at 98%` },
    { level: 'WARN', msg: `[${service}] DB pool utilization at 100% - requests queuing` },
    { level: 'WARN', msg: `[${service}] High latency detected: p99=4200ms (threshold: 500ms)` },
    { level: 'WARN', msg: `[${service}] GC pause duration: 850ms (threshold: 200ms)` },
    // INFO patterns
    { level: 'INFO', msg: `[${service}] Request processed in 4200ms (GET /api/payments)` },
    { level: 'INFO', msg: `[${service}] Request processed in 3800ms (POST /api/checkout)` },
    { level: 'INFO', msg: `[${service}] Deployment completed: version updated` },
    { level: 'INFO', msg: `[${service}] Health check: 503 Service Unavailable` },
    { level: 'INFO', msg: `[${service}] Retry attempt 1/3 for DB operation` },
    { level: 'INFO', msg: `[${service}] Thread pool exhausted, queuing request` },
    { level: 'DEBUG', msg: `[${service}] DB pool status: active=10/10, idle=0, pending=47` },
    { level: 'DEBUG', msg: `[${service}] DB pool status: active=10/10, idle=0, pending=83` },
  ];

  const totalLogs = 15 + Math.floor(Math.random() * 11); // 15-25 logs
  const shuffled = [...logTemplates].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(totalLogs, shuffled.length); i++) {
    const minutesAgo = Math.floor(Math.random() * windowMinutes);
    const timestamp = new Date(now - minutesAgo * 60 * 1000).toISOString();
    logs.push(`${timestamp} ${shuffled[i].level} ${shuffled[i].msg}`);
  }

  return logs.sort();
}
