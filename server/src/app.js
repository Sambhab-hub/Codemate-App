'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Trust Nginx reverse proxy headers (X-Forwarded-For)
app.set('trust proxy', 1);

// ── 1. Security Headers (Helmet) ───────────────────────────────────────────────
// Sets a dozen HTTP response headers to protect against common attacks:
//   Content-Security-Policy  — prevents XSS by restricting where scripts can load from
//   X-Frame-Options          — prevents clickjacking (embedding your site in an iframe)
//   X-Content-Type-Options   — prevents MIME sniffing
//   Referrer-Policy          — controls how much referrer info browsers send
// One line = massive security improvement. Always use in production.
app.use(helmet());

// ── 2. CORS ────────────────────────────────────────────────────────────────────
// Cross-Origin Resource Sharing — controls which domains can call this API.
// credentials:true is required to send cookies (for the refresh token).
// In production, CLIENT_URL is your deployed React app URL.
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);

// ── 3. Rate Limiting ───────────────────────────────────────────────────────────
// Applied to all /api routes. Tighter limits on /api/auth and /api/ai
// are applied at the route level in their respective route files.
app.use('/api', globalLimiter);

// ── 4. Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Reject huge payloads (DoS protection)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── 5. HTTP Request Logging ────────────────────────────────────────────────────
if (config.isDevelopment) {
  app.use(morgan('dev'));
}

// ── 6. Routes ──────────────────────────────────────────────────────────────────

// Health check — tests MongoDB connection status too
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';

  res.json({
    success: true,
    message: 'CodeMate API is running',
    environment: config.nodeEnv,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Feature routes — uncommented as phases are completed:
app.use('/api/auth', require('./routes/auth.routes'));        // Phase 4 ✅
app.use('/api/github', require('./routes/github.routes'));    // Phase 5 ✅
app.use('/api/repositories', require('./routes/repository.routes')); // Phase 6 ✅
app.use('/api/pull-requests', require('./routes/pullRequest.routes')); // Phase 7 ✅
app.use('/api/ai', require('./routes/ai.routes'));           // Phase 9 ✅
app.use('/api/issues', require('./routes/issue.routes'));    // Phase 11 ✅
app.use('/api/analytics', require('./routes/analytics.routes')); // Phase 12 ✅
app.use('/api/webhooks', require('./routes/webhook.routes')); // Phase 14 ✅

// ── 7. 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// ── 8. Global Error Handler ────────────────────────────────────────────────────
// MUST be last — 4 arguments signals Express this is an error handler
app.use(errorHandler);

module.exports = app;
