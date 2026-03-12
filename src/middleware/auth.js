const jwt = require('jsonwebtoken');

// Verifica que el request tenga un JWT válido
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Verifica que el usuario sea admin (para operaciones destructivas)
function requireAdmin(req, res, next) {
  if (!req.user?.es_admin) {
    return res.status(403).json({ error: 'Se requiere acceso de administrador' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
