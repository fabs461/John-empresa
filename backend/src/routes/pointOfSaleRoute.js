const express = require('express');
const router = express.Router();
const pointOfSaleController = require('../controllers/pointOfSaleController');
const verifyToken = require('../middleware/authMiddleware');

// Ruta pública: cualquiera puede ver los puntos de venta
router.get('/', pointOfSaleController.getAllPoints);

// Rutas protegidas: solo el administrador añade o elimina puntos de venta
router.post('/', verifyToken, pointOfSaleController.createPoint);
router.delete('/:id', verifyToken, pointOfSaleController.deletePoint);

module.exports = router;