const express = require('express');
const cors = require('cors');
const multer = require('multer');
  require('dotenv').config({
      path: '../.gitignore/.env'
  });

const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const { UPLOADS_DIR } = require('./src/middleware/uploadMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors()); // Permite peticiones desde tu frontend
app.use(express.json()); // Permite leer JSON en las peticiones HTTP

// Misma carpeta absoluta que usa multer para guardar las imágenes.
app.use("/uploads", express.static(UPLOADS_DIR));

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Ruta no encontrada
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
  console.log(`Servidor de John Empresa corriendo en http://localhost:${PORT}`);
});