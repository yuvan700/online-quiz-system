require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDatabase = require('./config/database');
const { router } = require('./routes/api');
const { notFound, errorHandler } = require('./middleware/errors');

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  await connectDatabase();
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method) || req.path.endsWith('/logout')) return next();
    if (!req.is('application/json')) return res.status(415).json({ error: 'This endpoint requires an application/json request body.' });
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }
    next();
  });
  app.use('/api', router);
  app.use('/', router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
  app.use(notFound);
  app.use(errorHandler);
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`Online Quiz System listening on http://localhost:${port}`));
}

startServer().catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
});
