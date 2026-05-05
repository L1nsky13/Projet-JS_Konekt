const fs   = require('fs')
const path = require('path')

const ordersPath = path.join(__dirname, '..', 'data', 'orders.json')

function toParisISO() {
  const d  = new Date()
  const local = d.toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
  const tz    = d.toLocaleString('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' })
  const m     = tz.match(/GMT([+-])(\d+)(?::(\d+))?/)
  const sign  = m[1]
  const hh    = m[2].padStart(2, '0')
  const mm    = (m[3] || '00').padStart(2, '0')
  const ms    = String(d.getMilliseconds()).padStart(3, '0')
  return `${local.replace(' ', 'T')}.${ms}${sign}${hh}:${mm}`
}

function getOrders() {
  if (!fs.existsSync(ordersPath)) return []
  const content = fs.readFileSync(ordersPath, 'utf-8').trim()
  if (!content) return []
  return JSON.parse(content)
}

function saveOrders(orders) {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2))
}

// GET /api/orders — récupère toutes les commandes
function getAllOrders(req, res) {
  res.json(getOrders())
}

// GET /api/orders/:id — récupère une commande par son ID
function getOrderById(req, res) {
  const orders = getOrders()
  const order  = orders.find(o => o.id === req.params.id)
  if (!order) return res.status(404).json({ message: 'Commande introuvable' })
  res.json(order)
}

// POST /api/orders — crée une commande à partir du contenu du panier
function createOrder(req, res) {
  const { items, total, devise, promo } = req.body
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'La commande doit contenir au moins un article' })
  }

  const orders = getOrders()
  const newOrder = {
    id     : `cmd-${Date.now()}`,
    date   : toParisISO(),
    statut : 'confirmée',
    items,
    promo  : promo || null,
    total  : total || items.reduce((acc, item) => acc + item.prix * item.quantite, 0),
    devise : devise || '€'
  }

  orders.push(newOrder)
  saveOrders(orders)
  res.status(201).json({ message: 'Commande créée', order: newOrder })
}

// DELETE /api/orders/:id — annule une commande
function cancelOrder(req, res) {
  const orders = getOrders()
  const index  = orders.findIndex(o => o.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'Commande introuvable' })

  orders[index].statut = 'annulée'
  saveOrders(orders)
  res.json({ message: 'Commande annulée', order: orders[index] })
}

module.exports = { getAllOrders, getOrderById, createOrder, cancelOrder }
