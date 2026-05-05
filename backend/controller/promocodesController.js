const fs   = require('fs')
const path = require('path')

const promoPath    = path.join(__dirname, '..', 'data', 'promocodes.json')
const productsPath = path.join(__dirname, '..', 'data', 'products.json')

function getPromocodes() {
  return JSON.parse(fs.readFileSync(promoPath, 'utf-8'))
}

function getProducts() {
  return JSON.parse(fs.readFileSync(productsPath, 'utf-8'))
}

// POST /api/promocodes/validate — { code, items }
function validate(req, res) {
  const { code, items } = req.body

  if (!code) return res.status(400).json({ valid: false, message: 'Code manquant' })
  if (!items || !Array.isArray(items)) return res.status(400).json({ valid: false, message: 'Articles manquants' })

  const promo = getPromocodes().find(p => p.code === code)
  if (!promo) return res.json({ valid: false, message: 'Code promo invalide' })

  // Cas spécial : uniquement sur les articles qui restent beaucoup en stock
  if (promo.type === 'slow_sellers') {
    const products = getProducts()
    const applicableIds = items
      .filter(item => {
        const product = products.find(p => String(p.id) === String(item.id))
        return product && product.quantite_stock >= promo.stock_min
      })
      .map(item => item.id)

    if (applicableIds.length === 0) {
      return res.json({ valid: false, message: 'Ce code ne s\'applique à aucun article de votre panier' })
    }

    return res.json({ valid: true, pourcentage: promo.pourcentage, type: 'slow_sellers', applicableIds })
  }

  // Code global
  return res.json({ valid: true, pourcentage: promo.pourcentage, type: 'global' })
}

module.exports = { validate }
