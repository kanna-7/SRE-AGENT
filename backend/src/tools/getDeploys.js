/**
 * Mock Observability Tool: Recent Deploys
 * Deterministic per (service + current hour)
 */

function stringHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export async function getRecentDeploys(service, windowMinutes = 30) {
  const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
  const seed = stringHash(service + hourSeed.toString());
  const rand = seededRandom(seed);

  const authors = ['alice@company.com', 'bob@company.com', 'carol@company.com', 'dave@company.com'];
  const now = Date.now();

  const versions = ['v2.3.1', 'v2.3.0', 'v2.2.9', 'v2.2.8', 'v2.4.0-beta'];
  const changesSummaries = [
    'Reduced DB pool size 50 → 10 (cost optimization)',
    'Bumped connection timeout from 60s → 5s',
    'Disabled connection retry logic',
    'Updated DB driver from pg@8 → pg@9',
    'Removed health check endpoint caching',
    'Enabled aggressive GC for memory savings',
  ];

  const deployCount = 3 + Math.floor(rand() * 3); // 3-5 deploys
  const deploys = [];

  for (let i = 0; i < deployCount; i++) {
    const minutesAgo = i === 0 ? 5 + Math.floor(rand() * 6) : 10 + Math.floor(rand() * (windowMinutes - 10));
    const deployedAt = new Date(now - minutesAgo * 60 * 1000).toISOString();

    deploys.push({
      commit: Math.random().toString(36).substring(2, 9),
      author: authors[Math.floor(rand() * authors.length)],
      version: versions[Math.floor(rand() * versions.length)],
      deployed_at: deployedAt,
      changes_summary: changesSummaries[Math.floor(rand() * changesSummaries.length)],
    });
  }

  return deploys.sort((a, b) => new Date(b.deployed_at) - new Date(a.deployed_at));
}
