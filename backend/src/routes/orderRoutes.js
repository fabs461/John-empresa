const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');

// Ruta pública: el cliente envía su pedido desde el carrito
router.post('/', orderController.createOrder);

// Ruta protegida: solo el administrador ve la lista de pedidos
router.get('/', verifyToken, orderController.getAllOrders);

// Ruta protegida: el administrador marca un pedido como concluido / pendiente
router.patch('/:id/status', verifyToken, orderController.updateOrderStatus);

module.exports = router;