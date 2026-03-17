// js/config.js — Configuración global del frontend
const CONFIG = {
  API_URL: window.APP_API_URL || 'https://partydecor-api-production.up.railway.app/api',
};

const TEMAS = ['neutro', 'rosa', 'gold', 'sage', 'lavender', 'ocean'];
const MODOS = ['light', 'dark'];
const ROLES = { super_admin: 'Super Admin', admin: 'Admin', usuario: 'Usuario', solo_lectura: 'Solo lectura' };
const ROLES_EMPRESA = { admin: 'Admin', empleado: 'Empleado', solo_lectura: 'Solo lectura' };