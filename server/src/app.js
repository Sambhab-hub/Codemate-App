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

app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);

app.use('/api', globalLimiter);

app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (config.isDevelopment) {
  app.use(morgan('dev'));
}

app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;

  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';

  res.json({
    success: true,
    message: 'CodeMate API is running',
    environment: config.nodeEnv,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/github', require('./routes/github.routes'));
app.use('/api/repositories', require('./routes/repository.routes'));
app.use('/api/pull-requests', require('./routes/pullRequest.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/issues', require('./routes/issue.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/webhooks', require('./routes/webhook.routes'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

app.use(errorHandler);

module.exports = app;
