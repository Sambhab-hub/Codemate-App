# 🚀 CodeMate — AI-Powered GitHub Code Review & Project Assistant

CodeMate is a full-stack, AI-powered developer tool that connects to GitHub accounts, inspects pull requests, displays file diff patches, and generates structured automated code reviews (scoring, security vulnerabilities, performance issues, code quality findings, and test recommendations) powered by OpenAI.

---

## 🛠️ Architecture & Tech Stack

```
                       ┌────────────────────────────────────────┐
                       │            React + Vite Frontend       │
                       │   Redux Toolkit · Tailwind · Recharts   │
                       └───────────────────┬────────────────────┘
                                           │ (HTTP REST / WebSockets)
                                           ▼
                       ┌────────────────────────────────────────┐
                       │           Node.js + Express API        │
                       │  CommonJS · Helmet · Rate Limiting      │
                       └─────────┬──────────────────┬───────────┘
                                 │                  │
                      ┌──────────┴──────┐   ┌───────┴──────────┐
                      │ MongoDB / Mongo │   │ Redis / BullMQ   │
                      │ Mongoose Models │   │ Background Queue │
                      └─────────────────┘   └──────────────────┘
```

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS | Redux Toolkit state, React Router 6, Recharts, Socket.IO client |
| **Backend API** | Node.js, Express (CommonJS) | REST architecture, Async handlers, Helmet security, Rate limiting |
| **Database** | MongoDB + Mongoose | 7 Mongoose schemas with compound indexes & validation |
| **AI Integration** | OpenAI SDK (`gpt-4o-mini`) | `json_object` structured outputs, prompt engineering, dev mock fallback |
| **Async Queues** | BullMQ + Redis | Background job queues with exponential backoff & concurrency |
| **Real-time** | Socket.IO | JWT socket auth, private user room broadcasting |
| **DevOps & CI/CD** | Docker, Docker Compose, GitHub Actions | Multi-stage Nginx build, multi-container orchestration, CI testing pipeline |

---

## 🔑 Key Features

1. **Authentication & Session Security:**
   - JWT Access Tokens (15m expiration) stored in Redux memory.
   - HttpOnly Refresh Token Cookies (7d expiration) for silent session restoration.
   - Bcrypt password hashing (12 salt rounds).
2. **GitHub OAuth 2.0 Integration:**
   - Secure authorization code exchange.
   - Stores GitHub access tokens with `select: false` protection.
3. **Repository & Pull Request Tracker:**
   - Remote repository import directly from GitHub API.
   - Interactive Git patch diff viewer with line additions (`+`) and deletions (`-`).
4. **AI Code Review Engine:**
   - Overall Quality Score (0.0 to 10.0), Risk Level assessment.
   - Categorized findings (Security, Performance, Bug, Code Quality, Error Handling) with file & line pills and actionable fix snippets.
5. **AI Bug Assistant & Issues:**
   - Plain-text bug root-cause diagnosis.
   - GitHub Issue import & 1-click AI analysis.
6. **Analytics Dashboard:**
   - Recharts visual graphs of findings by category.
   - Metric counters for repositories, PRs, reviews, issues, and average quality scores.
7. **Background Job Queuing & Real-time Alerts:**
   - BullMQ background review processing.
   - Socket.IO real-time notification bell with pulse badge.

---

## ⚡ Quick Start Guide (Local Development)

### 1. Prerequisites
- Node.js v20+
- MongoDB (or Docker)
- Redis (optional — automatic fallback to direct mode if offline)

### 2. Start Database (via Docker)
```bash
docker run -d -p 27017:27017 --name codemate-mongo mongo:7
docker run -d -p 6379:6379 --name codemate-redis redis:7-alpine
```

### 3. Setup Backend Server
```bash
cd server
npm install
npm run dev
```
Server runs at: `http://localhost:5000`

### 4. Setup Frontend Client
```bash
cd client
npm install
npm run dev
```
Client runs at: `http://localhost:5173`

---

## 🐳 Docker Deployment

Run the complete multi-container stack with one command:
```bash
docker-compose up --build
```
- Client (Nginx): `http://localhost`
- Server (API): `http://localhost:5000`

---

## 🧪 Testing

Run backend integration tests:
```bash
cd server
npm test
```

---

## 🎤 Interview Defense Preparation Q&A

**Q: Why use Redux Toolkit in memory for Access Tokens and HttpOnly Cookies for Refresh Tokens?**
> Storing access tokens in `localStorage` or `sessionStorage` leaves them vulnerable to Cross-Site Scripting (XSS) attacks. By keeping short-lived access tokens in JS memory (Redux) and long-lived refresh tokens in `HttpOnly` cookies (which JavaScript cannot read), we protect against XSS token theft while supporting silent session refresh.

**Q: How does the AI Code Review Engine ensure deterministic JSON responses?**
> We use OpenAI's `response_format: { type: "json_object" }` alongside a strict system prompt instructing the model to act as a security auditor returning raw JSON matching our schema. We set a low `temperature` (0.2) for consistency and validate all parsed properties before persisting.

**Q: How do you prevent blocking the main Node.js event loop during heavy operations?**
> Heavy tasks like fetching diffs from GitHub and executing AI reviews are delegated to BullMQ background job queues powered by Redis. The Express API responds immediately with `202 Accepted`, allowing worker processes to handle jobs asynchronously. Upon completion, Socket.IO emits real-time notifications to the client browser.
