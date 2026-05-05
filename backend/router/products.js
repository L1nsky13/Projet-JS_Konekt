const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

// Chemin absolu vers le fichier products.json
const productsPath = path.join(__dirname, '..', 'data', 'products.json')

// Fonction utilitaire pour lire les produits depuis le fichier JSON
function getProducts() {
  const data = fs.readFileSync(productsPath, 'utf-8')
  return JSON.parse(data)
}

// Fonction utilitaire pour sauvegarder les produits dans le fichier JSON
function saveProducts(products) {
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2))
}

// ─────────────────────────────────────────────
// GET /api/products
// Retourne tous les produits
// ─────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json(getProducts())
})

// ─────────────────────────────────────────────
// PATCH /api/products/:id/stock
// Met à jour le stock d'un produit après un achat
// Body attendu : { "quantite": 2 }
// ─────────────────────────────────────────────
router.patch('/:id/stock', (req, res) => {
  const products = getProducts()
  const index = products.findIndex(p => p.id === req.params.id)

  if (index === -1) {
    return res.status(404).json({ message: 'Produit introuvable' })
  }

  const { quantite } = req.body

  // Vérifie que la quantité est valide
  if (!quantite || quantite < 1) {
    return res.status(400).json({ message: 'Quantité invalide' })
  }

  // Vérifie que le stock est suffisant
  if (products[index].quantite_stock < quantite) {
    return res.status(400).json({
      message: 'Stock insuffisant',
      stock_disponible: products[index].quantite_stock
    })
  }

  // Décrémente le stock
  products[index].quantite_stock -= quantite
  saveProducts(products)

  res.json({
    message: 'Stock mis à jour',
    produit: products[index]
  })
})

module.exports = router