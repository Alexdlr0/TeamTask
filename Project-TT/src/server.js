
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const pool = require('./config/database');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(helmet());
app.use(express.json());

app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'TeamTask API'
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  async function startServer() {
    try {
      await pool.query('SELECT 1');
      console.log('Conexión con MySQL establecida.');

      app.listen(PORT, () => {
        console.log(`TeamTask API escuchando en el puerto ${PORT}`);
      });
    } catch (error) {
      console.error(
        'No fue posible conectar con MySQL:',
        error.message
      );
      process.exitCode = 1;
    }
  }

  startServer();
}

module.exports = app;
