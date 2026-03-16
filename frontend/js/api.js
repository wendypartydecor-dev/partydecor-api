// js/api.js — Funciones de comunicación con el backend
async function api(method, path, body, useToken = true) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (useToken && S.token) opts.headers['Authorization'] = 'Bearer ' + S.token;
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(CONFIG.API_URL + path, opts);
  if (res.status === 401) { 
    if (path !== '/auth/login') cerrarSesion(); 
    throw new Error('Sesión expirada'); 
  }
  if (!res.ok) { 
    const err = await res.json().catch(()=>({})); 
    throw new Error(err.error || 'Error ' + res.status); 
  }
  return res.json();
}

// Admin API
async function adminApi(method, path, body) {
  return api(method, '/admin' + path, body, true);
}

async function empresaApi(method, path, body) {
  return api(method, '/empresa' + path, body, true);
}