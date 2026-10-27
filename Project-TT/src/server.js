
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'TeamTask API'
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TeamTask API escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
