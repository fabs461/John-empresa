const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
require('dotenv').config();
const upload = require('./src/middleware/uploadMiddleware');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "https://johnempresatag.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Endpoint ligero para despertar el servidor (Render lo apaga tras
// inactividad). No consulta la base de datos: solo confirma que el
// proceso está despierto y respondiendo.
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Manejo de errores (incluye los que lanza multer: formato no permitido, archivo muy pesado, etc.)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'La imagen no puede pesar más de 5MB.' });
    }
    return res.status(400).json({ error: 'Error al subir la imagen: ' + err.message });
  }
  if (err && err.message === 'Formato no permitido') {
    return res.status(400).json({ error: 'Formato de imagen no permitido. Usa JPG, PNG, WEBP, GIF o AVIF.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Servidor escuchando
app.listen(PORT, () => {
  console.log(`Servidor de John Empresa corriendo en Aiven`);
});