'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimiter } = require('./middlewares/rateLimiter');
const { errorHandler } = require('./middlewares/errorHandler');
const filigraneRoutes = require('./routes/filigrane.routes');

const app = express();

// Sécurité
app.use(helmet());

// CORS — supporte plusieurs origines séparées par des virgules dans FRONTEND_URL
const originesAutorisees = (process.env.FRONTEND_URL || 'http://localhost:4200')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || originesAutorisees.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origine CORS non autorisée : ${origin}`));
    }
  },
  methods: ['POST', 'GET'],
}));

// Rate limiting global sur /api
app.use('/api', rateLimiter);

// Routes
app.use('/api', filigraneRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'FiligraneBF API', version: '1.0.0' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ erreur: 'Route introuvable.' });
});

// Gestionnaire d'erreurs global
app.use(errorHandler);

module.exports = app;
