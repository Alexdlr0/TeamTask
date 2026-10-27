
const express = require('express');
const userController = require('../controllers/user.controller');
const {
  authenticateToken,
  requireAdmin
} = require('../middleware/auth.middleware');

const router = express.Router();

// Inicio de sesión: no requiere un token previo.
router.post('/login', userController.loginUser);

// Registro: requiere autenticación y rol de administrador.
router.post(
  '/register',
  authenticateToken,
  requireAdmin,
  userController.registerUser
);

module.exports = router;
