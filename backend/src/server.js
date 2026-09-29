import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { db, emitter } from './store.js';

const app = express();
const PORT = process.env.PORT || 3001;
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key';

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// ─── Seed demo data ──────────────────────────────────────────────────────────
if (DEMO_MODE) {
  db.seed();
}

// ─── Import routes ───────────────────────────────────────────────────────────
import incidentsRouter from './routes/incidents.js';
import chaosRouter from './routes/chaos.js';

app.use('/api/incidents', incidentsRouter);
app.use('/api/chaos', chaosRouter);

// ─── SSE — Real-time events endpoint ─────────────────────────────────────────
const sseClients = new Set();

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (type, data) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sseClients.add(send);
  send('connected', { message: 'SSE connected', demo: DEMO_MODE });

  // Heartbeat every 30s
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    sseClients.delete(send);
    clearInterval(heartbeat);
  });
});

// Broadcast realtime events to all SSE clients
emitter.on('incident:insert', (data) => {
  sseClients.forEach((send) => send('incident:insert', data));
});
emitter.on('incident:update', (data) => {
  sseClients.forEach((send) => send('incident:update', data));
});
emitter.on('timeline:insert', (data) => {
  sseClients.forEach((send) => send('timeline:insert', data));
});

// ─── Stats endpoint ──────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  res.json(db.getStats());
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    demo: DEMO_MODE,
    timestamp: new Date().toISOString(),
    incidents: db.listIncidents().length,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const server = createServer(app);
server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║         🤖  AI SRE AGENT  — BACKEND              ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  URL:      http://localhost:${PORT}                  ║`);
  console.log(`║  Mode:     ${DEMO_MODE ? '🎭 DEMO (no API keys needed)   ' : '🔑 LIVE (real APIs)            '}  ║`);
  console.log(`║  OpenAI:   ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key' ? '✅ configured                  ' : '❌ missing (using mock AI)     '}  ║`);
  console.log(`║  Supabase: ${process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('demo') ? '✅ configured                  ' : '❌ missing (using in-memory)   '}  ║`);
  console.log(`║  Hindsight:${process.env.HINDSIGHT_API_KEY && process.env.HINDSIGHT_API_KEY !== 'demo-key' ? '✅ configured                  ' : '❌ missing (using mock memory) '}  ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

export { DEMO_MODE };
