
const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

const ALLOWED_ROLES = ['admin', 'leader', 'member'];

async function registerUser(req, res) {
  try {
    const { name, email, password, role } = req.body || {};

    // Validar que todos los campos sean cadenas de texto.
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof role !== 'string'
    ) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios.'
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role.trim();

    if (!cleanName || !cleanEmail || !password || !cleanRole) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios.'
      });
    }

    if (cleanName.length > 100) {
      return res.status(400).json({
        message: 'El nombre no puede superar los 100 caracteres.'
      });
    }

    if (cleanEmail.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: 'El correo electrónico no es válido.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 8 caracteres.'
      });
    }

    if (!ALLOWED_ROLES.includes(cleanRole)) {
      return res.status(400).json({
        message: 'El rol indicado no es válido.'
      });
    }

    // Verificar que el correo no esté registrado.
    const existingUser = await userModel.findByEmail(cleanEmail);

    if (existingUser) {
      return res.status(409).json({
        message: 'Ya existe un usuario con ese correo electrónico.'
      });
    }

    // Nunca guardar la contraseña original en la base de datos.
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await userModel.createUser({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: cleanRole
    });

    // No devolver el hash de la contraseña al cliente.
    return res.status(201).json({
      message: 'Usuario registrado correctamente.',
      user
    });
  } catch (error) {
    // La restricción UNIQUE también protege ante registros simultáneos.
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Ya existe un usuario con ese correo electrónico.'
      });
    }

    console.error('Error al registrar usuario:', error.message);

    return res.status(500).json({
      message: 'Ocurrió un error interno al registrar el usuario.'
    });
  }
}


async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'El correo y la contraseña son obligatorios.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await userModel.findByEmail(cleanEmail);

    // Usar el mismo mensaje para no revelar si el correo existe.
    if (!user) {
      return res.status(401).json({
        message: 'Correo o contraseña incorrectos.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Correo o contraseña incorrectos.'
      });
    }

    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurada.');

      return res.status(500).json({
        message: 'La autenticación no está configurada correctamente.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: '1h'
      }
    );

    return res.status(200).json({
      message: 'Inicio de sesión correcto.',
      token,
      expiresIn: 3600,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });


  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);

    return res.status(500).json({
      message: 'Ocurrió un error interno al iniciar sesión.'
    });
  }
}

module.exports = {
  registerUser,
  loginUser
};
