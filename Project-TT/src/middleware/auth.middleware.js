
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Debes iniciar sesión para acceder a este recurso.'
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: 'El token de autenticación es obligatorio.'
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET no está configurada.');

    return res.status(500).json({
      message: 'La autenticación no está configurada correctamente.'
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    if (
      !Number.isInteger(payload.id) ||
      typeof payload.role !== 'string'
    ) {
      return res.status(401).json({
        message: 'El token no contiene datos válidos.'
      });
    }

    req.user = {
      id: payload.id,
      role: payload.role
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'El token es inválido o ha expirado.'
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'No tienes permisos para realizar esta acción.'
    });
  }

  return next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
