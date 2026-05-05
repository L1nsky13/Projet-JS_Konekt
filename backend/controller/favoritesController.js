const fs = require('fs')
const path = require('path')

const favoritesPath = path.join(__dirname, '..', 'data', 'favorites.json')

// Lit les favoris
function getFavorites() {
  if (!fs.existsSync(favoritesPath)) return []
  const content = fs.readFileSync(favoritesPath, 'utf-8').trim()
  if (!content) return []
  return JSON.parse(content)
}

// Sauvegarde les favoris
function saveFavorites(favorites) {
  fs.writeFileSync(favoritesPath, JSON.stringify(favorites, null, 2))
}

// Retourne tous les favoris
function getAllFavorites(req, res) {
  res.json(getFavorites())
}

// Ajoute un produit aux favoris (évite les doublons)
function addFavorite(req, res) {
  const { id, nom, prix, image } = req.body
  if (!id) return res.status(400).json({ message: 'ID produit manquant' })

  const favorites = getFavorites()
  const alreadyExists = favorites.some(item => item.id === id)

  if (alreadyExists) {
    return res.status(409).json({ message: 'Produit déjà en favoris' })
  }

  favorites.push({ id, nom, prix, image })
  saveFavorites(favorites)
  res.json({ message: 'Produit ajouté aux favoris', favorites })
}

// Supprime un produit des favoris
function removeFavorite(req, res) {
  let favorites = getFavorites()
  const initialLength = favorites.length
  favorites = favorites.filter(item => item.id !== req.params.id)

  if (favorites.length === initialLength) {
    return res.status(404).json({ message: 'Produit non trouvé dans les favoris' })
  }

  saveFavorites(favorites)
  res.json({ message: 'Produit retiré des favoris', favorites })
}

module.exports = { getAllFavorites, addFavorite, removeFavorite }