import http from 'http'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND  = path.join(__dirname, '..', 'frontend')
const DATA      = path.join(__dirname, 'data')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.ttf' : 'font/ttf',
  '.ico' : 'image/x-icon'
}

// Utilitaires

function readJSON(name) {
  const file = path.join(DATA, `${name}.json`)
  if (!fs.existsSync(file)) return []
  const content = fs.readFileSync(file, 'utf-8').trim()
  return content ? JSON.parse(content) : []
}

function writeJSON(name, data) {
  fs.writeFileSync(path.join(DATA, `${name}.json`), JSON.stringify(data, null, 2))
}

function getBody(req) {
  return new Promise(resolve => {
    let raw = ''
    req.on('data', chunk => raw += chunk)
    req.on('end', () => resolve(raw ? JSON.parse(raw) : {}))
  })
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
}

function sendHTML(res, file) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  fs.createReadStream(path.join(FRONTEND, 'templates', file)).pipe(res)
}

function sendStatic(res, filePath) {
  const mime = MIME[path.extname(filePath)] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': mime })
  fs.createReadStream(filePath).pipe(res)
}

// Serveur

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')
  const m = req.method

  if (m === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type'
    })
    return res.end()
  }

  // Pages HTML

  const pages = { '/': 'index.html', '/products': 'products.html', '/kit': 'kit.html', '/cart': 'cart.html', '/favorites': 'favorites.html' }
  if (m === 'GET' && pages[pathname]) return sendHTML(res, pages[pathname])

  // API Produits

  if (pathname === '/api/products' && m === 'GET') {
    return json(res, readJSON('products'))
  }

  const stockMatch = pathname.match(/^\/api\/products\/(.+)\/stock$/)
  if (stockMatch && m === 'PATCH') {
    const products = readJSON('products')
    const i = products.findIndex(p => p.id === stockMatch[1])
    if (i === -1) return json(res, { message: 'Produit introuvable' }, 404)
    const { quantite } = await getBody(req)
    if (!quantite || quantite < 1) return json(res, { message: 'Quantité invalide' }, 400)
    if (products[i].quantite_stock < quantite) return json(res, { message: 'Stock insuffisant' }, 400)
    products[i].quantite_stock -= quantite
    writeJSON('products', products)
    return json(res, { message: 'Stock mis à jour', produit: products[i] })
  }

  // API Panier

  if (pathname === '/api/cart') {
    if (m === 'GET')    return json(res, readJSON('cart'))
    if (m === 'DELETE') { writeJSON('cart', []); return json(res, { message: 'Panier vidé' }) }
    if (m === 'POST') {
      const { id, nom, prix, image, quantite, taille, flocage } = await getBody(req)
      if (!id || !quantite) return json(res, { message: 'Données manquantes' }, 400)
      const cart = readJSON('cart')
      const i = cart.findIndex(item => item.id === id && item.taille === (taille || null))
      if (i !== -1) {
        cart[i].quantite += quantite
      } else {
        cart.push({ id, nom, prix, image, quantite, taille: taille || null, flocage: flocage || null })
      }
      writeJSON('cart', cart)
      return json(res, { message: 'Produit ajouté', cart })
    }
  }

  const cartItem = pathname.match(/^\/api\/cart\/(.+)$/)
  if (cartItem) {
    const id   = cartItem[1]
    const cart = readJSON('cart')
    if (m === 'PUT') {
      const { quantite } = await getBody(req)
      if (!quantite || quantite < 1) return json(res, { message: 'Quantité invalide' }, 400)
      const i = cart.findIndex(item => item.id === id)
      if (i === -1) return json(res, { message: 'Introuvable' }, 404)
      cart[i].quantite = quantite
      writeJSON('cart', cart)
      return json(res, { message: 'Quantité mise à jour', cart })
    }
    if (m === 'DELETE') {
      const filtered = cart.filter(item => item.id !== id)
      if (filtered.length === cart.length) return json(res, { message: 'Introuvable' }, 404)
      writeJSON('cart', filtered)
      return json(res, { message: 'Produit supprimé', cart: filtered })
    }
  }

  // API Favoris

  if (pathname === '/api/favorites') {
    if (m === 'GET') return json(res, readJSON('favorites'))
    if (m === 'POST') {
      const { id, nom, prix, image } = await getBody(req)
      if (!id) return json(res, { message: 'ID manquant' }, 400)
      const favorites = readJSON('favorites')
      if (favorites.some(f => f.id === id)) return json(res, { message: 'Déjà en favoris' }, 409)
      favorites.push({ id, nom, prix, image })
      writeJSON('favorites', favorites)
      return json(res, { message: 'Ajouté', favorites })
    }
  }

  const favItem = pathname.match(/^\/api\/favorites\/(.+)$/)
  if (favItem && m === 'DELETE') {
    const favorites = readJSON('favorites').filter(f => f.id !== favItem[1])
    writeJSON('favorites', favorites)
    return json(res, { message: 'Retiré', favorites })
  }

  // API Commandes

  if (pathname === '/api/orders') {
    if (m === 'GET') return json(res, readJSON('orders'))
    if (m === 'POST') {
      const { items, total, devise, promo } = await getBody(req)
      if (!items || !Array.isArray(items) || items.length === 0) return json(res, { message: 'Commande vide' }, 400)
      const orders = readJSON('orders')
      const order = {
        id    : `cmd-${Date.now()}`,
        date  : new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }),
        statut: 'confirmée',
        items,
        promo : promo || null,
        total : total || items.reduce((acc, item) => acc + item.prix * item.quantite, 0),
        devise: devise || '€'
      }
      orders.push(order)
      writeJSON('orders', orders)
      return json(res, { message: 'Commande créée', order }, 201)
    }
  }

  const orderItem = pathname.match(/^\/api\/orders\/(.+)$/)
  if (orderItem) {
    const orders = readJSON('orders')
    if (m === 'GET') {
      const order = orders.find(o => o.id === orderItem[1])
      return order ? json(res, order) : json(res, { message: 'Introuvable' }, 404)
    }
    if (m === 'DELETE') {
      const i = orders.findIndex(o => o.id === orderItem[1])
      if (i === -1) return json(res, { message: 'Introuvable' }, 404)
      orders[i].statut = 'annulée'
      writeJSON('orders', orders)
      return json(res, { message: 'Commande annulée', order: orders[i] })
    }
  }

  // API Codes promo

  if (pathname === '/api/promocodes/validate' && m === 'POST') {
    const { code, items } = await getBody(req)
    if (!code || !items) return json(res, { valid: false, message: 'Données manquantes' }, 400)
    const promo = readJSON('promocodes').find(p => p.code === code)
    if (!promo) return json(res, { valid: false, message: 'Code promo invalide' })
    if (promo.type === 'slow_sellers') {
      const products = readJSON('products')
      const applicableIds = items
        .filter(item => {
          const p = products.find(p => String(p.id) === String(item.id))
          return p && p.quantite_stock >= promo.stock_min
        })
        .map(item => item.id)
      if (applicableIds.length === 0) return json(res, { valid: false, message: "Ce code ne s'applique à aucun article de votre panier" })
      return json(res, { valid: true, pourcentage: promo.pourcentage, type: 'slow_sellers', applicableIds })
    }
    return json(res, { valid: true, pourcentage: promo.pourcentage, type: 'global' })
  }

  // Fichiers statiques

  if (m === 'GET') {
    const filePath = path.join(FRONTEND, pathname)
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return sendStatic(res, filePath)
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(8080, () => console.log('Serveur Konekt démarré sur http://localhost:8080'))
