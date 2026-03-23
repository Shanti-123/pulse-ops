<div align="center">

```
██████╗ ██╗   ██╗██╗     ███████╗███████╗ ██████╗ ██████╗ ███████╗
██╔══██╗██║   ██║██║     ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
██████╔╝██║   ██║██║     ███████╗█████╗  ██║   ██║██████╔╝███████╗
██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝  ██║   ██║██╔═══╝ ╚════██║
██║     ╚██████╔╝███████╗███████║███████╗╚██████╔╝██║     ███████║
╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚══════╝
```

### 🤖 AI-Powered Observability Platform for Modern DevOps Teams

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Now-00E5A0?style=for-the-badge)](https://pulse-ops-eight.vercel.app/)
[![Backend API](https://img.shields.io/badge/⚡_Backend-Health_Check-00D4FF?style=for-the-badge)](https://pulse-ops-p2xq.onrender.com/health)
[![GitHub](https://img.shields.io/badge/📦_Source-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Shanti-123/pulse-ops)

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Angular](https://img.shields.io/badge/Angular-16.x-DD0031?style=flat-square&logo=angular)](https://angular.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Groq AI](https://img.shields.io/badge/Groq_AI-LLaMA_3.3-FF6B35?style=flat-square)](https://groq.com)
[![API Tests](https://img.shields.io/badge/API_Tests-58%2F58-00E5A0?style=flat-square)](https://github.com/Shanti-123/pulse-ops)
[![E2E Tests](https://img.shields.io/badge/E2E_Tests-58%2F58-00D4FF?style=flat-square)](https://github.com/Shanti-123/pulse-ops)

</div>

---

## 🌟 What is PulseOps?

**PulseOps** is a production-grade AI observability platform that **automatically detects anomalies, investigates incidents, and generates postmortems** — all without human intervention.

When a service spikes in CPU or latency, PulseOps:
1. 🔍 **Detects** it using Z-score statistical analysis
2. 🤖 **Investigates** it autonomously using an AI agent with 5 MCP tools
3. 📋 **Generates** a postmortem and emergency runbook automatically
4. 📡 **Broadcasts** incident updates live to the dashboard via WebSocket

> *Built to demonstrate senior-level full-stack engineering with AI integration — from raw metric ingestion to intelligent root cause analysis.*

---

## 🎬 Live Demo

🔗 **[https://pulse-ops-eight.vercel.app/](https://pulse-ops-eight.vercel.app/)**

Register a new account to explore. Three roles are supported:

| Role | What They Can Do |
|------|-----------------|
| **Admin** | Full access — register services, delete, manage everything |
| **Engineer** | Read + Write — create deployments, resolve incidents |
| **Viewer** | Read only — view incidents and use AI Query Engine |

> ⚠️ Hosted on Render free tier — first request may take 30–50 seconds to wake up.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   Angular 16 · TypeScript · SCSS · WebSocket · JWT Auth        │
│   Dashboard · Services · Incidents · AI Query Engine           │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼──────────────────────────────────────────┐
│                       API LAYER                                 │
│   Express.js · Node.js 22 · TypeScript · JWT + RBAC Middleware │
│   REST: Auth · Metrics · Incidents · Logs · NLQ · Services     │
└──────┬──────────────────────────────────┬────────────────────────┘
       │                                  │
┌──────▼──────────────┐     ┌─────────────▼──────────────────────┐
│   DETECTION ENGINE  │     │         AI ENGINE (MCP)            │
│                     │     │                                    │
│  Stage 1:           │     │  Auto-triggered on incident        │
│  Threshold Check    │     │  ① query_logs                     │
│  (no DB needed)     │     │  ② check_deployments              │
│         ↓           │     │  ③ analyze_anomaly  (Groq)        │
│  Stage 2:           │     │  ④ draft_postmortem (Groq)        │
│  Z-Score Analysis   │     │  ⑤ suggest_runbook  (Groq)        │
│  σ > 2.5 = anomaly  │─────▶  Root Cause + Fix + Confidence    │
└─────────────────────┘     └────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│   MongoDB Atlas · Time-Series Collection · Mongoose ORM        │
│   Models: Users · Metrics · Incidents · Logs · Deployments     │
│                    Services                                     │
└─────────────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                   REAL-TIME LAYER                               │
│   WebSocket Server (ws) · Node EventEmitter · Broadcasting     │
│   metric:ingested · anomaly:detected · incident:created/updated│
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🔐 Authentication & RBAC

- JWT access token (1 hour) + refresh token (1 day) with rotation
- bcrypt password hashing
- Strong password validation on registration (uppercase, lowercase, number, special char)
- Three roles enforced via middleware on every route

```
┌─────────────┬──────────────────────────────────────────────────┐
│    Role     │                  Permissions                     │
├─────────────┼──────────────────────────────────────────────────┤
│   Admin     │ Full access · Delete services · All routes      │
│  Engineer   │ Read + Write · Create deployments · Resolve     │
│   Viewer    │ Read only · View incidents · Use AI Query       │
└─────────────┴──────────────────────────────────────────────────┘
```

### 📊 Metric Ingestion & Anomaly Detection

Two-stage detection pipeline runs automatically on every metric push:

```
Metric pushed via SDK or POST /api/metrics
               ↓
  Stage 1 — Threshold Check (instant, no DB)
    CPU > 90%  OR  Memory > 95%
    Latency > 3000ms  OR  ErrorRate > 10%
               ↓ no breach
  Stage 2 — Z-Score (needs 5+ readings in DB)
    Z = (current_value - mean) / standard_deviation
    |Z| > 2.5  →  Anomaly detected
    |Z| > 3.5  →  Critical severity
               ↓
  Incident auto-created with 5-minute cooldown
```

### 🤖 AI Investigation Agent (MCP)

When an incident is created, the AI agent runs 5 tools in sequence:

```
Incident Created
      ↓
  ┌─────────────────────────────────────────────────┐
  │              MCP AGENT PIPELINE                │
  │                                                 │
  │  Tool 1: query_logs        → Fetch recent errors│
  │  Tool 2: check_deployments → Find recent deploys│
  │  Tool 3: analyze_anomaly   → AI root cause      │
  │  Tool 4: draft_postmortem  → Write postmortem   │
  │  Tool 5: suggest_runbook   → Emergency runbook  │
  │                                                 │
  │  Model:  Groq LLaMA 3.3-70B                    │
  │  Output: Root Cause · Suggested Fix · ~85% Conf │
  └─────────────────────────────────────────────────┘
      ↓
  incident.aiAnalysis, .postmortem, .runbook saved in DB
```

### 🧠 Natural Language Query Engine

Ask questions in plain English — PulseOps queries the DB and returns an AI answer:

```
User: "Show me all critical incidents from today"
         ↓
  Classify → incidents
         ↓
  Fetch critical incidents from DB (last 24h)
         ↓
  Send to Groq LLaMA 3.1-8B with context
         ↓
  "There are 2 critical incidents today. The most recent
   is in payment-service triggered 3 hours ago..."
```

### ⚡ Real-Time WebSocket Events

```
Metric pushed    →  metric:ingested    →  Dashboard refreshes
Anomaly found    →  anomaly:detected   →  Notification shown
Incident created →  incident:created  →  Incidents list updates
Incident updated →  incident:updated  →  Detail page refreshes
```

### 🖥️ Frontend Pages

| Page | Key Features |
|------|-------------|
| **Login / Register** | Mode toggle · Password strength (register only) · Role select |
| **Dashboard** | 6 stat cards · Recent incidents · Services overview · Live WS dot |
| **Services** | Register · Search · Filter · Status update · Delete (admin only) |
| **Incidents** | Filter by status/severity · Assign · Resolve · Close · Pagination |
| **Incident Detail** | Overview · AI Analysis · Postmortem · Runbook · Deployment badge |
| **AI Query Engine** | Chat UI · Suggestion pills · Clear · Character counter |

---

## 🗂️ Project Structure

```
pulse-ops/
├── server/src/
│   ├── config/db.ts              ← MongoDB Atlas connection
│   ├── events/emitter.ts         ← Node EventEmitter bus
│   ├── models/                   ← 6 Mongoose models
│   │   ├── user.model.ts
│   │   ├── metric.model.ts       ← Time-series collection
│   │   ├── incident.model.ts
│   │   ├── deployment.model.ts
│   │   ├── log.model.ts
│   │   └── service.model.ts
│   ├── controllers/              ← 7 REST controllers
│   ├── routes/                   ← 7 route files
│   ├── middleware/
│   │   ├── auth.middleware.ts    ← JWT verify + requireRole
│   │   ├── validate.middleware.ts
│   │   └── error.middleware.ts
│   ├── services/
│   │   ├── anomaly.service.ts    ← Threshold + Z-score detection
│   │   ├── alert.service.ts      ← Incident creation + cooldown
│   │   └── websocket.service.ts  ← Real-time broadcasting
│   ├── mcp/
│   │   ├── agent.ts              ← AI tool orchestrator
│   │   └── tools/                ← 5 investigation tools
│   └── server.ts                 ← Express + HTTP + WebSocket
│
├── client/src/app/
│   ├── core/
│   │   ├── guards/auth.guard.ts
│   │   ├── interceptors/auth.interceptor.ts
│   │   └── services/ (api, auth, websocket)
│   ├── modules/
│   │   ├── auth/login/
│   │   ├── dashboard/
│   │   ├── services/
│   │   ├── incidents/
│   │   └── nlq/
│   └── shared/ (sidebar, topbar)
│
├── sdk/src/
│   ├── pulseops.sdk.ts           ← SDK class (written, untested E2E)
│   └── types.ts
│
└── client/e2e/                   ← 58 Playwright tests
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Angular 16 + TypeScript | SPA framework |
| **Styling** | SCSS + CSS Variables | Dark "Obsidian Command" theme |
| **Backend** | Node.js 22 + Express | REST API server |
| **Language** | TypeScript | Type safety full stack |
| **Database** | MongoDB Atlas | Time-series metric storage |
| **ORM** | Mongoose 8 | Schema + query layer |
| **AI Inference** | Groq + LLaMA 3.3-70B | AI investigation + NLQ |
| **AI Protocol** | MCP | Structured AI tool calling |
| **Auth** | JWT + bcryptjs | Stateless authentication |
| **Real-time** | WebSocket (ws) | Live event broadcasting |
| **Testing** | Playwright + Node fetch | E2E + API tests |
| **Deploy** | Vercel + Render | Cloud hosting |

---

## 📡 API Reference

```http
# Auth
POST /api/auth/register     { name, email, password, role }
POST /api/auth/login        { email, password }
POST /api/auth/refresh      { refreshToken }
POST /api/auth/logout       { refreshToken }

# Services
POST   /api/services                      Register / upsert
GET    /api/services?environment=&status= List with filters
GET    /api/services/:serviceId           Get by ID
PATCH  /api/services/:serviceId/status   Update (engineer+)
DELETE /api/services/:serviceId          Delete (admin only)

# Metrics — no auth needed (SDK pushes directly)
POST /api/metrics                         Ingest
GET  /api/metrics/:serviceId?limit=       History (engineer+)
GET  /api/metrics/:serviceId/latest       Latest (engineer+)

# Incidents
GET   /api/incidents/stats?hoursBack=      Stats summary
GET   /api/incidents?status=&severity=&page=&limit=
GET   /api/incidents/:id
PATCH /api/incidents/:id/assign            { assignedTo }
PATCH /api/incidents/:id/resolve           { rootCause, notes }
PATCH /api/incidents/:id/close

# Logs — no auth needed (SDK pushes directly)
POST /api/logs                            Ingest
GET  /api/logs?serviceId=&level=          Query (engineer+)

# Deployments
POST /api/deployments                     Create (engineer+)
GET  /api/deployments?serviceId=          List (engineer+)

# NLQ
POST /api/nlq/query                       { question }
```

---

## 🚀 Run Locally

### 1. Clone
```bash
git clone https://github.com/Shanti-123/pulse-ops.git
cd pulse-ops
npm install
```

### 2. Create `server/.env`
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pulseops
JWT_SECRET=any_long_random_string
REFRESH_TOKEN_SECRET=another_long_random_string
GROQ_API_KEY=gsk_your_groq_api_key
CLIENT_URL=http://localhost:4200
PORT=3000
```

### 3. Start Backend
```bash
npx ts-node server/src/server.ts
```

### 4. Start Frontend
```bash
cd client && npm install && ng serve
# Open http://localhost:4200
```

### 5. SDK Usage
```typescript
import { PulseOpsSDK } from './sdk/src/pulseops.sdk';

const pulseops = new PulseOpsSDK({
  serverUrl: 'http://localhost:3000',
  serviceId: 'payment-service',
  serviceName: 'Payment Service',
});

await pulseops.register();

pulseops.startAutoTracking(() => ({
  cpu: 45.2, memory: 62.1, latency: 120, errorRate: 0.5,
}));

await pulseops.error('Payment failed', err.stack, { orderId: '456' });
```

> ⚠️ SDK code is complete. Full E2E integration test with an external service is on the roadmap.

---

## 🧪 Test Coverage

### Backend API Tests — 58 passing ✅
```bash
npx ts-node server/src/scripts/testAllApis.ts
```

| Suite | Tests | Coverage |
|-------|-------|---------|
| AUTH | 9 | Register · Login · Wrong password · Weak password · Duplicate · No token · Invalid token |
| SERVICES | 10 | CRUD · Duplicate → 409 · Missing fields → 400 · 404 · RBAC viewer/engineer |
| METRICS | 5 | Push normal/anomalous · Missing serviceId → 400 · Get latest/history |
| INCIDENTS | 11 | List · Stats · Filters · Pagination · Resolve · rootCause required · Assign · Close · RBAC |
| LOGS | 9 | All 5 levels · Query · Filter level · Missing serviceId → 400 · Invalid level |
| DEPLOYMENTS | 5 | Create · Get all · Get by service · Missing fields · Viewer → 403 |
| NLQ | 5 | Incidents · Services · Deployments · Logs · Fatal logs questions |
| DELETE/RBAC | 4 | Viewer → 403 · Engineer → 403 · Admin can delete · Already deleted → 404 |

### Playwright E2E Tests — 58 passing ✅
```bash
cd client
npx playwright test --reporter=list
```

| Suite | Tests | Coverage |
|-------|-------|---------|
| AUTH | 13 | Page loads · Forms · Validation · Register · Login · Strength · Logout · Guards |
| DASHBOARD | 14 | Stat cards · Navigation · Active highlights · Refresh · Links · User info · WS status |
| SERVICES | 10 | Register · Search · Filter · Clear · Status update · Delete · Admin-only buttons |
| INCIDENTS | 11 | Filters · Clear · Click row · Detail tabs · Resolve/Assign validation · Meta cards |
| NLQ | 10 | Chat · Send · Enter key · Suggestions · Clear · Character limit · Loading state |

---

## 💡 Engineering Decisions

### Why Z-Score?
Threshold alerts cause false positives. Z-score adapts to each service's baseline:
```
Z = (current - mean) / std_deviation
Trigger if |Z| > 2.5  (industry standard)
```
A payment service at 80% CPU is normal. A reporting service at 80% is an anomaly.

### Why MCP for AI Tools?
Gives the AI a **typed, structured interface** to call tools — making investigation deterministic and auditable rather than letting the LLM hallucinate free-form.

### Why WebSocket?
Incident dashboards need sub-second updates. HTTP polling adds 1–5 second lag and wastes bandwidth. WebSocket gives instant, persistent, bidirectional updates at zero cost.

### Why MongoDB Time-Series?
Metrics are append-only, time-ordered — exactly what time-series collections optimize: automatic bucketing, compression, and time-range queries.

---

## 🗺️ Roadmap

| Feature | Notes |
|---------|-------|
| Multi-tenancy | `tenantId` on all models + middleware filter |
| Rate limiting | `express-rate-limit` per API key |
| SDK E2E testing | Full integration test with real Express service |
| Docker Compose | Single command local setup |
| Data TTL | MongoDB TTL index — expire metrics after 30 days |
| SDK batching | Buffer metrics, flush every 5 seconds |

---

## 🌐 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://pulse-ops-eight.vercel.app/ |
| Backend | Render | https://pulse-ops.onrender.com |
| Database | MongoDB Atlas M0 | Cloud — Singapore |

---

## 👩‍💻 What This Demonstrates

| Skill | Evidence |
|-------|---------|
| Full-stack TypeScript | Angular + Node.js end to end |
| AI Integration | MCP tools + Groq LLM + prompt engineering |
| Real-time Systems | WebSocket server + event-driven architecture |
| Statistical Algorithms | Z-score anomaly detection |
| REST API Design | 7 resource domains + proper HTTP codes |
| Auth & Security | JWT rotation + bcrypt + RBAC middleware |
| Database Design | Time-series collection + references |
| Testing | 58 API + 58 Playwright E2E tests |
| Production Patterns | Cooldowns + retry logic + error handling |
| Clean Architecture | Controllers → Services → Models |

---

<div align="center">

**⭐ Star this repo if you found it useful!**

[![GitHub stars](https://img.shields.io/github/stars/Shanti-123/pulse-ops?style=social)](https://github.com/Shanti-123/pulse-ops)

Built with ❤️ — MEAN Stack + Groq AI

</div>
