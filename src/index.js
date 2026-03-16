// src/index.js — versión Aurea
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET no definido en .env');
  process.exit(1);
}

const express = require('express');
const cors    = require('cors');

const authRoutes     = require('./routes/auth');
const listasRoutes   = require('./routes/listas');
const eventosRoutes  = require('./routes/eventos');
const itemsRoutes    = require('./routes/items');
const pdfRoutes      = require('./routes/pdf');
const empresasRoutes = require('./routes/empresas'); 
const clientesRoutes = require('./routes/clientes');
const adminRoutes = require('./routes/admin');
const empresaConfigRoutes = require('./routes/empresaConfig');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

// ─── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true, service: 'aurea-api' }));

// ─── Rutas ───────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/listas',   listasRoutes);
app.use('/api/eventos',  eventosRoutes);
app.use('/api/items',    itemsRoutes);
app.use('/api/pdf',      pdfRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/empresa', empresaConfigRoutes); 

// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// ─── Error global ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ─── Arrancar ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ aurea-api corriendo en http://localhost:${PORT}`);
  console.log(`  Supabase: ${process.env.SUPABASE_URL}`);
});
