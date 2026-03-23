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

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Now-00E5A0?style=for-the-badge)](https://pulse-ops.vercel.app)
[![Backend API](https://img.shields.io/badge/⚡_Backend_API-Render-00D4FF?style=for-the-badge)](https://pulse-ops.onrender.com/health)
[![GitHub](https://img.shields.io/badge/📦_Source_Code-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Shantiiiii-12300000/pulse-ops)

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Angular](https://img.shields.io/badge/Angular-16.x-DD0031?style=flat-square&logo=angular)](https://angular.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Groq AI](https://img.shields.io/badge/Groq_AI-LLaMA_3.3-FF6B35?style=flat-square)](https://groq.com)
[![Tests](https://img.shields.io/badge/Tests-98%2F98_Passing-00E5A0?style=flat-square)](https://github.com/Shantiiiii-12300000/pulse-ops)

</div>

---

## 🌟 What is PulseOps?

**PulseOps** is a production-grade AI observability platform that **automatically detects anomalies, investigates incidents, and generates postmortems** — all without human intervention. Think of it as a self-healing operations center powered by AI.

When your service spikes in CPU or latency, PulseOps:
1. 🔍 **Detects** it using Z-score statistical analysis
2. 🤖 **Investigates** it autonomously using an AI agent with 5 MCP tools
3. 📋 **Generates** a postmortem and emergency runbook automatically
4. 📡 **Streams** the entire investigation live to your dashboard via WebSocket

> *"Built to demonstrate senior-level full-stack engineering with AI integration — from raw metric ingestion to intelligent root cause analysis."*

---

## 🎬 Live Demo

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@demo.com | Admin@Demo1! |
| **Engineer** | eng@demo.com | Engineer@Demo1! |
| **Viewer** | viewer@demo.com | Viewer@Demo1! |

🔗 **[https://pulse-ops.vercel.app](https://pulse-ops.vercel.app)**

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
│   Express.js · Node.js 22 · TypeScript · JWT Middleware        │
│   REST APIs: Auth · Metrics · Incidents · Logs · NLQ           │
└──────┬──────────────────────────────────┬────────────────────────┘
       │                                  │
┌──────▼──────────────┐     ┌─────────────▼──────────────────────┐
│   DETECTION ENGINE  │     │         AI ENGINE                  │
│                     │     │                                    │
│  Threshold Check    │     │  MCP Agent (Groq LLaMA 3.3)       │
│  ↓                  │     │  ↓                                 │
│  Z-Score Analysis   │     │  ① query_logs                     │
│  (std deviation)    │     │  ② check_deployments              │
│  ↓                  │     │  ③ analyze_anomaly                │
│  Anomaly Event      │     │  ④ draft_postmortem               │
│  ↓                  │     │  ⑤ suggest_runbook                │
│  Incident Created   │─────▶  Root Cause + Fix + Confidence    │
└─────────────────────┘     └────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│   MongoDB Atlas · Time-Series Collection · Mongoose ORM        │
│   Models: Users · Metrics · Incidents · Logs · Deployments     │
└─────────────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                   REAL-TIME LAYER                               │
│   WebSocket Server · Event Emitter · Live Broadcasting         │
│   Events: metric:ingested · anomaly:detected · incident:*      │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Feature Showcase

### 🔐 Authentication & RBAC
```
Register → Login → JWT (1hr) + Refresh Token (1d) → Role-Based Access

┌─────────────┬──────────────────────────────────────────────────┐
│    Role     │                  Permissions                     │
├─────────────┼──────────────────────────────────────────────────┤
│   Admin     │ Full access · Delete services · Manage all data │
│  Engineer   │ Read + Write · Create deployments · Resolve     │
│   Viewer    │ Read only · View incidents · Use AI Query       │
└─────────────┴──────────────────────────────────────────────────┘
```

### 📊 Metric Ingestion & Anomaly Detection
```
Service pushes metrics → Threshold check → Z-Score analysis
                                                    ↓
                         Mean ± 2.5 Standard Deviations = Anomaly
                                                    ↓
                              Incident auto-created with severity
```

**Two-stage detection pipeline:**
- **Stage 1 — Threshold:** CPU > 90%, Memory > 95%, Latency > 3000ms → immediate alert
- **Stage 2 — Z-Score:** Statistical spike beyond 2.5 standard deviations → smart alert

### 🤖 AI Investigation Agent (MCP)

When an incident is created, the AI agent runs **5 tools automatically**:

```
Incident Created
      ↓
  ┌─────────────────────────────────────────────┐
  │           AI AGENT PIPELINE                │
  │                                             │
  │  Tool 1: query_logs          → Recent errors│
  │  Tool 2: check_deployments   → Recent deploys│
  │  Tool 3: analyze_anomaly     → Deep analysis │
  │  Tool 4: draft_postmortem    → Auto postmortem│
  │  Tool 5: suggest_runbook     → Emergency steps│
  │                                             │
  │  Output: Root Cause + Fix + 85% Confidence  │
  └─────────────────────────────────────────────┘
```

### 🧠 Natural Language Query Engine
```
User: "Show me all critical incidents from last week"
           ↓
    PulseOps classifies → fetches DB data → asks Groq LLaMA
           ↓
    "There are 3 critical incidents in the last 7 days.
     The most recent is 'CRITICAL anomaly in payment-service'
     triggered 2 hours ago with CPU at 95%..."
```

### ⚡ Real-Time WebSocket Events
```
Metric pushed → metric:ingested → Dashboard updates live
Anomaly found → anomaly:detected → Alert notification
Incident created → incident:created → Incidents list updates
AI investigates → incident:updated → Detail page streams steps
```

---

## 🗂️ Project Structure

```
pulse-ops/
├── 🖥️  server/                    ← Express + Node.js Backend
│   └── src/
│       ├── config/db.ts           ← MongoDB Atlas connection
│       ├── models/                ← 6 Mongoose models
│       │   ├── user.model.ts
│       │   ├── metric.model.ts    ← Time-series collection
│       │   ├── incident.model.ts
│       │   ├── deployment.model.ts
│       │   ├── log.model.ts
│       │   └── service.model.ts
│       ├── controllers/           ← 7 REST controllers
│       ├── routes/                ← 7 route files
│       ├── middleware/
│       │   ├── auth.middleware.ts ← JWT + Role guard
│       │   ├── validate.middleware.ts
│       │   └── error.middleware.ts
│       ├── services/
│       │   ├── anomaly.service.ts ← Z-score detection engine
│       │   ├── alert.service.ts   ← Incident creation + cooldown
│       │   └── websocket.service.ts ← Real-time broadcasting
│       ├── mcp/
│       │   ├── agent.ts           ← AI orchestrator
│       │   ├── mcp.server.ts
│       │   └── tools/             ← 5 AI investigation tools
│       │       ├── query_logs.ts
│       │       ├── check_deployments.ts
│       │       ├── analyze_anomaly.ts
│       │       ├── draft_postmortem.ts
│       │       └── suggest_runbook.ts
│       └── server.ts              ← Express + HTTP + WS entry
│
├── 🅰️  client/                    ← Angular 16 Frontend
│   └── src/app/
│       ├── core/
│       │   ├── guards/auth.guard.ts
│       │   ├── interceptors/auth.interceptor.ts
│       │   └── services/
│       │       ├── api.service.ts
│       │       ├── auth.service.ts
│       │       └── websocket.service.ts
│       ├── modules/
│       │   ├── auth/login/        ← Login + Register + Strength
│       │   ├── dashboard/         ← Stats + Live feed
│       │   ├── services/          ← Service registry
│       │   ├── incidents/         ← List + Detail + AI tabs
│       │   └── nlq/               ← AI Query Engine
│       └── shared/
│           ├── sidebar/
│           └── topbar/
│
├── 📦  sdk/                       ← Node.js SDK
│   └── src/
│       ├── pulseops.sdk.ts        ← SDK class
│       └── types.ts
│
└── 🧪  client/e2e/                ← Playwright E2E Tests
    ├── 01-auth.spec.ts            ← 13 auth tests
    ├── 02-dashboard.spec.ts       ← 14 dashboard tests
    ├── 03-services.spec.ts        ← 10 service tests
    ├── 04-incidents.spec.ts       ← 11 incident tests
    └── 05-nlq.spec.ts             ← 10 NLQ tests
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Angular 16 + TypeScript | Enterprise-grade SPA framework |
| **Styling** | SCSS + CSS Variables | "Obsidian Command" dark theme |
| **Backend** | Node.js 22 + Express | Fast, scalable REST API |
| **Language** | TypeScript (strict) | Type safety across the stack |
| **Database** | MongoDB Atlas | Time-series collections for metrics |
| **ORM** | Mongoose 8 | Schema validation + queries |
| **AI** | Groq + LLaMA 3.3-70B | Fast, free AI inference |
| **AI Protocol** | MCP (Model Context Protocol) | Structured AI tool calling |
| **Auth** | JWT + bcryptjs | Stateless, secure authentication |
| **Real-time** | WebSocket (ws) | Live event broadcasting |
| **Testing** | Playwright + Node.js scripts | E2E + API test coverage |
| **Deployment** | Vercel + Render | Zero-config cloud deployment |

---

## 📡 API Reference

### Authentication
```http
POST /api/auth/register    → Register new user
POST /api/auth/login       → Login + get tokens
POST /api/auth/refresh     → Rotate access token
POST /api/auth/logout      → Invalidate refresh token
```

### Services
```http
POST   /api/services                    → Register service
GET    /api/services                    → List all services
GET    /api/services/:serviceId         → Get by ID
PATCH  /api/services/:serviceId/status → Update status
DELETE /api/services/:serviceId         → Delete (admin only)
```

### Metrics
```http
POST /api/metrics                        → Ingest metric (SDK)
GET  /api/metrics/:serviceId             → Get history
GET  /api/metrics/:serviceId/latest      → Get latest
```

### Incidents
```http
GET   /api/incidents/stats          → Statistics dashboard
GET   /api/incidents                → List with filters
GET   /api/incidents/:id            → Get by ID
PATCH /api/incidents/:id/assign     → Assign to engineer
PATCH /api/incidents/:id/resolve    → Resolve with root cause
PATCH /api/incidents/:id/close      → Close incident
```

### Logs & Deployments
```http
POST /api/logs                       → Ingest log (SDK)
GET  /api/logs?serviceId=&level=     → Query logs

POST /api/deployments                → Create deployment
GET  /api/deployments?serviceId=     → Query deployments
```

### AI Natural Language Query
```http
POST /api/nlq/query
Body: { "question": "How many critical incidents are open?" }
Response: { "answer": "There are 3 critical incidents...", "data": {...} }
```

---

## 🚀 Quick Start

### Prerequisites
```
Node.js 18+
MongoDB Atlas account (free tier)
Groq API key (free at console.groq.com)
```

### 1. Clone
```bash
git clone https://github.com/Shantiiiii-12300000/pulse-ops.git
cd pulse-ops
```

### 2. Backend Setup
```bash
# Install dependencies
npm install

# Create environment file
cp server/.env.example server/.env
# Fill in: MONGODB_URI, JWT_SECRET, REFRESH_TOKEN_SECRET, GROQ_API_KEY

# Start server
npx ts-node server/src/server.ts
```

### 3. Frontend Setup
```bash
cd client
npm install
ng serve
```

### 4. Open App
```
http://localhost:4200
```

### 5. SDK Integration (any Node.js service)
```typescript
import { PulseOpsSDK } from './sdk/src/pulseops.sdk';

const pulseops = new PulseOpsSDK({
  serverUrl: 'http://localhost:3000',
  serviceId: 'payment-service',
  serviceName: 'Payment Service',
});

// Register your service
await pulseops.register();

// Auto-track metrics every 30 seconds
pulseops.startAutoTracking(() => ({
  cpu: getCpuUsage(),
  memory: getMemoryUsage(),
  latency: getAvgLatency(),
  errorRate: getErrorRate(),
}));

// Log errors automatically
await pulseops.error('Payment failed', err.stack, { userId });
```

---

## 🧪 Test Coverage

### Backend API Tests — 98/98 Passing ✅
```
npx ts-node server/src/scripts/testAllApis.ts
```

| Suite | Tests | Status |
|-------|-------|--------|
| AUTH | 9 tests | ✅ All passing |
| SERVICES | 10 tests | ✅ All passing |
| METRICS | 5 tests | ✅ All passing |
| INCIDENTS | 11 tests | ✅ All passing |
| LOGS | 9 tests | ✅ All passing |
| DEPLOYMENTS | 5 tests | ✅ All passing |
| NLQ | 5 tests | ✅ All passing |
| DELETE/RBAC | 4 tests | ✅ All passing |

### Playwright E2E Tests — 58/58 Passing ✅
```bash
cd client
npx playwright test --reporter=list
```

| Suite | Tests | Coverage |
|-------|-------|----------|
| AUTH | 13 tests | Register · Login · Password strength · RBAC |
| DASHBOARD | 14 tests | Stats · Navigation · WebSocket · User info |
| SERVICES | 10 tests | CRUD · Search · Delete · Status update |
| INCIDENTS | 11 tests | Filters · Detail · Tabs · Resolve · Assign |
| NLQ | 10 tests | Query · Suggestions · Chat · Clear |

---

## 🌐 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://pulse-ops.vercel.app |
| Backend | Render | https://pulse-ops.onrender.com |
| Database | MongoDB Atlas | Cloud (Singapore region) |

### Deploy Your Own
```bash
# 1. Fork this repo

# 2. Deploy backend to Render
#    Root: / | Build: npm run build | Start: npm start

# 3. Deploy frontend to Vercel
#    Root: client | Build: npm run build -- --configuration production

# 4. Set environment variables on Render:
MONGODB_URI=your_atlas_uri
JWT_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
GROQ_API_KEY=your_groq_key
CLIENT_URL=your_vercel_url
```

---

## 💡 Key Engineering Decisions

### Why Z-Score for Anomaly Detection?
Simple threshold alerts (CPU > 90%) generate too many false positives. Z-score measures how far a value deviates from the **statistical norm** of that specific service. A payment service running at 80% CPU is normal; a reporting service at 80% is an anomaly.

```
Z = (current_value - mean) / standard_deviation
Anomaly if |Z| > 2.5  (industry standard threshold)
```

### Why MCP for AI Tools?
Model Context Protocol gives the AI agent a **structured interface** to call tools with typed inputs/outputs. This prevents hallucinations and makes the investigation pipeline deterministic and auditable.

### Why WebSocket over Polling?
The dashboard shows live metric updates and AI agent steps streaming in real-time. HTTP polling would add 1-5 second delay and waste bandwidth. WebSocket gives us **instant, bidirectional, persistent** communication.

### Why MongoDB Time-Series?
Metrics are append-only, time-ordered data. MongoDB's native time-series collections provide **automatic bucketing, compression, and query optimization** for exactly this use case — far better than a regular collection.

---

## 🗺️ Roadmap

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-tenancy | 📋 Planned | Add `tenantId` to all models + middleware filter |
| Rate limiting | 📋 Planned | `express-rate-limit` per API key |
| SDK batching | 📋 Planned | Buffer 5 metrics, flush every 5 seconds |
| ReAct AI loop | 📋 Planned | Multi-turn reasoning instead of sequential tools |
| Docker compose | 📋 Planned | Single command local setup |
| API key per service | 📋 Planned | Per-service auth instead of JWT for SDK |

---

## 👩‍💻 About

Built as a portfolio project to demonstrate:

- **Full-stack TypeScript** development (Angular + Node.js)
- **AI integration** with MCP tools and LLM inference
- **Real-time systems** with WebSocket event broadcasting
- **Statistical algorithms** (Z-score anomaly detection)
- **Production patterns** (JWT rotation, RBAC, cooldowns, retry logic)
- **Testing discipline** (98 backend + 58 E2E tests)

---

<div align="center">

**⭐ Star this repo if you found it useful!**

[![GitHub stars](https://img.shields.io/github/stars/Shantiiiii-12300000/pulse-ops?style=social)](https://github.com/Shantiiiii-12300000/pulse-ops)

Made with ❤️ and lots of ☕

</div>
