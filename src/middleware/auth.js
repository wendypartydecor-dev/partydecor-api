const jwt = require('jsonwebtoken');

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

function requireAdmin(req, res, next) {
  if (!req.user?.es_admin) {
    return res.status(403).json({ error: 'Se requiere acceso de administrador' });
  }
  next();
}

function requireSuperAdmin(req, res, next) {
  if (req.user?.rol !== 'super_admin') {
    return res.status(403).json({ error: 'Se requiere acceso de Super Admin' });
  }
  next();
}

function requireAdminEmpresa(req, res, next) {
  const rol = req.user?.rol_empresa;
  if (rol !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de Admin en esta empresa' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireSuperAdmin, requireAdminEmpresa };
