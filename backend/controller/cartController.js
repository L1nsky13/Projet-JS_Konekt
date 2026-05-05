const fs = require('fs')
const path = require('path')

const cartPath = path.join(__dirname, '..', 'data', 'cart.json')

// Lit le panier depuis le fichier JSON
function getCart() {
  if (!fs.existsSync(cartPath)) return []
  const content = fs.readFileSync(cartPath, 'utf-8').trim()
  if (!content) return []
  return JSON.parse(content)
}

// Sauvegarde le panier dans le fichier JSON
function saveCart(cart) {
  fs.writeFileSync(cartPath, JSON.stringify(cart, null, 2))
}

// Retourne tout le panier
function getAllItems(req, res) {
  res.json(getCart())
}

// Ajoute un produit ou augmente sa quantité
function addItem(req, res) {
  const { id, nom, prix, image, quantite, taille, flocage } = req.body
  if (!id || !quantite) return res.status(400).json({ message: 'Données manquantes' })

  const cart = getCart()
  // On distingue les entrées par id ET taille (S et M sont deux lignes séparées)
  const existingIndex = cart.findIndex(item =>
    item.id === id && item.taille === (taille || null)
  )

  if (existingIndex !== -1) {
    // Le produit avec la même taille est déjà dans le panier
    cart[existingIndex].quantite += quantite
  } else {
    // Nouvelle entrée avec sa taille et son flocage
    cart.push({ id, nom, prix, image, quantite, taille: taille || null, flocage: flocage || null })
  }

  saveCart(cart)
  res.json({ message: 'Produit ajouté au panier', cart })
}

// Modifie la quantité d'un produit
function updateItem(req, res) {
  const { quantite } = req.body
  if (!quantite || quantite < 1) return res.status(400).json({ message: 'Quantité invalide' })

  const cart = getCart()
  const index = cart.findIndex(item => item.id === req.params.id)

  if (index === -1) return res.status(404).json({ message: 'Produit non trouvé dans le panier' })

  cart[index].quantite = quantite
  saveCart(cart)
  res.json({ message: 'Quantité mise à jour', cart })
}

// Supprime un produit du panier
function removeItem(req, res) {
  let cart = getCart()
  const initialLength = cart.length
  cart = cart.filter(item => item.id !== req.params.id)

  if (cart.length === initialLength) {
    return res.status(404).json({ message: 'Produit non trouvé dans le panier' })
  }

  saveCart(cart)
  res.json({ message: 'Produit supprimé', cart })
}

// Vide entièrement le panier
function clearCart(req, res) {
  saveCart([])
  res.json({ message: 'Panier vidé' })
}

module.exports = { getAllItems, addItem, updateItem, removeItem, clearCart }