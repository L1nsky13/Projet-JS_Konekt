const express = require('express')
const router = express.Router()
const favoritesController = require('../controller/favoritesController')

// GET /api/favorites — récupère tous les favoris
router.get('/', favoritesController.getAllFavorites)

// POST /api/favorites — ajoute un produit aux favoris
router.post('/', favoritesController.addFavorite)

// DELETE /api/favorites/:id — supprime un produit des favoris
router.delete('/:id', favoritesController.removeFavorite)

module.exports = router