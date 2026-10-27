
require('dotenv').config();

const bcrypt = require('bcryptjs');
const pool = require('./config/database');
const userModel = require('./models/user.model');
const readline = require('readline/promises');

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const name = (await rl.question('Nombre del administrador: ')).trim();
    const email = (await rl.question('Correo del administrador: '))
      .trim()
      .toLowerCase();
    const password = await rl.question(
      'Contraseña inicial (mínimo 8 caracteres): '
    );

    if (!name || name.length > 100) {
      throw new Error('El nombre es obligatorio y no debe superar 100 caracteres.');
    }

    if (
      email.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new Error('El correo electrónico no es válido.');
    }

    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres.');
    }

    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM users'
    );

    if (Number(rows[0].total) > 0) {
      throw new Error(
        'La tabla ya contiene usuarios. No se creará otro administrador inicial.'
      );
    }

    const existingUser = await userModel.findByEmail(email);

    if (existingUser) {
      throw new Error('Ese correo ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await userModel.createUser({
      name,
      email,
      passwordHash,
      role: 'admin'
    });

    console.log('\nAdministrador creado correctamente.');
    console.log(`ID: ${admin.id}`);
    console.log(`Correo: ${admin.email}`);
    console.log(`Rol: ${admin.role}`);
  } finally {
    rl.close();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('\nNo se pudo crear el administrador:', error.message);
  process.exitCode = 1;
});
