# 🤖 AI SRE Agent

> *"Every AI agent is a goldfish. I gave mine memory — and it became the Senior SRE you wish was on call."*

An AI-powered incident response agent that **remembers every incident it has ever resolved** using [Hindsight](https://github.com/vectorize-io/hindsight) persistent memory. Every new incident benefits from all past ones.

## 🧠 The Key Insight

Most AI systems are stateless — they forget everything after each session. This agent uses **Hindsight persistent memory** to retain knowledge of every incident resolution. When a similar incident happens again, the agent recalls past context, boosting its confidence score by +10 and proposing proven fixes instantly.

**First incident:** 4 minutes to resolve.  
**Same incident again:** 8 seconds. Same code. Only difference: Hindsight memory.

## 🏗️ Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + TailwindCSS |
| **Backend** | Node.js + Express (ES Modules) |
| **Database** | Supabase (Postgres + Realtime) |
| **AI Engine** | OpenAI GPT-4o (diagnosis, postmortem) + GPT-4o-mini (triage) |
| **Memory** | [Hindsight](https://github.com/vectorize-io/hindsight) — persistent vector memory |

## 📁 Project Structure

```
ai-sre-agent/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express entry point
│   │   ├── routes/
│   │   │   ├── incidents.js       # Incident CRUD + postmortem API
│   │   │   └── chaos.js           # Chaos trigger endpoint
│   │   ├── agents/
│   │   │   ├── triage.js          # GPT-4o-mini severity classification
│   │   │   ├── diagnose.js        # GPT-4o with Hindsight memory recall
│   │   │   └── remediate.js       # Fix execution + memory retention
│   │   ├── memory/
│   │   │   └── hindsight.js       # Hindsight retain/recall/reflect client
│   │   └── tools/
│   │       ├── getDeploys.js      # Mock deploy history
│   │       ├── getLogs.js         # Mock application logs
│   │       └── getMetrics.js      # Mock service metrics
│   └── supabase/
│       └── schema.sql             # Database schema + RLS policies
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx      # Incident feed + stats
        │   └── IncidentDetail.jsx # Full incident investigation view
        └── components/
            ├── ChaosButton.jsx    # Incident trigger UI
            ├── IncidentTimeline.jsx # Realtime event stream
            ├── RootCauseCard.jsx  # AI diagnosis display
            ├── FixConfidence.jsx  # Historical success rates
            └── PostmortemView.jsx # GPT-4o postmortem generator
```

## 🚀 Setup

### 1. Prerequisites
- Node.js 18+
- Supabase account ([supabase.com](https://supabase.com))
- OpenAI account ([platform.openai.com](https://platform.openai.com))
- Hindsight API key ([hindsight.vectorize.io](https://hindsight.vectorize.io/))

### 2. Database Setup
1. Create a new Supabase project
2. Go to **SQL Editor** → paste contents of `backend/supabase/schema.sql` → **Run**

### 3. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_SERVICE_KEY, HINDSIGHT_API_KEY, OPENAI_API_KEY
npm install
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 5. Open the app
Navigate to [http://localhost:5173](http://localhost:5173)

## 🎬 Demo Flow

1. **Open dashboard** — clean slate, no incidents
2. **Click 🚨 Trigger Incident** → choose `payment-api` + `db_pool_exhaustion`
3. **Watch live timeline** populate: alert → triage → logs → AI diagnosis
4. **See root cause** with confidence score + evidence
5. **Check "Similar Past Incidents"** — empty on first run (no memory yet)
6. **Click ✅ Approve Fix** → recovery → MTTR recorded
7. **Generate postmortem** — blameless AI-written report
8. **Trigger the SAME incident again** → agent recalls from Hindsight → instant resolution ⚡

## 🔗 Links

- **Hindsight GitHub:** [https://github.com/vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)
- **Hindsight Docs:** [https://hindsight.vectorize.io/](https://hindsight.vectorize.io/)
- **What is Agent Memory:** [https://vectorize.io/what-is-agent-memory](https://vectorize.io/what-is-agent-memory)
