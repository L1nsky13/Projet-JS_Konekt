const express = require('express')
const router = express.Router()
const cartController = require('../controller/cartController')

// GET /api/cart — récupère tout le panier
router.get('/', cartController.getAllItems)

// POST /api/cart — ajoute un produit
router.post('/', cartController.addItem)

// PUT /api/cart/:id — modifie la quantité d'un produit
router.put('/:id', cartController.updateItem)

// DELETE /api/cart/:id — supprime un produit
router.delete('/:id', cartController.removeItem)

// DELETE /api/cart — vide le panier
router.delete('/', cartController.clearCart)

module.exports = router