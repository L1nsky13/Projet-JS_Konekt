const express          = require('express')
const router           = express.Router()
const ordersController = require('../controller/ordersController')

// GET /api/orders — toutes les commandes
router.get('/', ordersController.getAllOrders)

// GET /api/orders/:id — une commande par ID
router.get('/:id', ordersController.getOrderById)

// POST /api/orders — créer une commande
router.post('/', ordersController.createOrder)

// DELETE /api/orders/:id — annuler une commande
router.delete('/:id', ordersController.cancelOrder)

module.exports = router
