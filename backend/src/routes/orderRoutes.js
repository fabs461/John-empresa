const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');

// Ruta pública: el cliente envía su pedido desde el carrito
router.post('/', orderController.createOrder);

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');

// Ruta pública: el cliente envía su pedido desde el carrito
router.post('/', orderController.createOrder);

// Ruta protegida: solo el administrador ve la lista de pedidos
router.get('/', verifyToken, orderController.getAllOrders);

// Rutas protegidas: solo el administrador puede eliminar o concluir pedidos
router.delete('/:id', verifyToken, orderController.deleteOrder);
router.patch('/:id/complete', verifyToken, orderController.completeOrder);

module.exports = router;