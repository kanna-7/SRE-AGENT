/**
 * Mock Observability Tool: Service Metrics
 * Returns realistic performance metrics, spiked based on recent deploys
 */
import { getRecentDeploys } from './getDeploys.js';

export async function getMetrics(service, windowMinutes = 30) {
  const deploys = await getRecentDeploys(service, windowMinutes);
  const hasRecentDeploy = deploys.length > 0 && deploys[0];

  // Spike metrics if there was a recent deploy (within 15 minutes)
  let p99Spike = 1;
  let errorSpike = 1;
  if (hasRecentDeploy) {
    const deployAge = (Date.now() - new Date(deploys[0].deployed_at)) / (1000 * 60);
    if (deployAge < 15) {
      p99Spike = 3.5;
      errorSpike = 5;
    }
  }

  return {
    p50: Math.round(120 * (hasRecentDeploy ? 1.8 : 1)),
    p99: Math.round(4200 * p99Spike),
    error_rate: parseFloat((12.4 * errorSpike).toFixed(1)),
    throughput: Math.round(890 * (hasRecentDeploy ? 0.6 : 1)),
    cpu: hasRecentDeploy ? 78 : 42,
    memory: hasRecentDeploy ? 82 : 55,
    db_pool_usage: hasRecentDeploy ? 98 : 45,
    window_minutes: windowMinutes,
    service,
  };
}
