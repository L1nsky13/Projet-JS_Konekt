const express = require('express')
const cors    = require('cors')
const path    = require('path')
const fs      = require('fs')
const app     = express()

app.use(cors())
app.use(express.json())

// ─── EJS ─────────────────────────────────────
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '..', 'frontend', 'templates'))

// ─── Routers API ─────────────────────────────
// IMPORTANT : avant express.static
const productsRouter       = require('./router/products')
const cartRouter           = require('./router/cart')
const favoritesRouter      = require('./router/favorites')
const ordersRouter         = require('./router/orders')
const promocodesController = require('./controller/promocodesController')

app.use('/api/products',  productsRouter)
app.use('/api/cart',      cartRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/orders',    ordersRouter)

app.post('/api/promocodes/validate', promocodesController.validate)

// ─── Utilitaires ─────────────────────────────

// Lit et parse le products.json
function getProducts() {
  const filePath = path.join(__dirname, 'data', 'products.json')
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

// Extrait les clubs uniques d'une compétition, triés par ID
function getClubsByCompetition(products, competitionLabel) {
  const clubsMap = {}

  products.forEach(p => {
    const competitions = p.caracteristiques.competition
    const club         = p.caracteristiques.club

    if (
      Array.isArray(competitions) &&
      competitions.includes(competitionLabel) &&
      club &&
      club !== 'NaN' &&
      !clubsMap[club]
    ) {
      clubsMap[club] = { nom: club, id: parseInt(p.id) }
    }
  })

  return Object.values(clubsMap).sort((a, b) => a.id - b.id)
}

// Données navbar communes à toutes les vues EJS
function getNavData() {
  const products       = getProducts()
  const clubsEhf       = getClubsByCompetition(products, 'EHF Champions League')
  const clubsStarligue = getClubsByCompetition(products, 'Liqui Moly Starligue')
  return { clubsEhf, clubsStarligue }
}

// ─── Routes EJS ──────────────────────────────
// IMPORTANT : avant express.static

// Page d'accueil
app.get('/', (req, res) => {
  res.render('index', getNavData())
})

// Page catalogue
app.get('/products', (req, res) => {
  res.render('products', getNavData())
})

// Page détail produit (kit)
app.get('/kit', (req, res) => {
  const ejsPath  = path.join(__dirname, '..', 'frontend', 'templates', 'kit.ejs')
  const htmlPath = path.join(__dirname, '..', 'frontend', 'templates', 'kit.html')

  if (fs.existsSync(ejsPath)) {
    res.render('kit', getNavData())
  } else if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath)
  } else {
    res.status(404).send('Page kit introuvable')
  }
})

// Page panier
app.get('/cart', (req, res) => {
  const ejsPath  = path.join(__dirname, '..', 'frontend', 'templates', 'cart.ejs')
  const htmlPath = path.join(__dirname, '..', 'frontend', 'templates', 'cart.html')

  if (fs.existsSync(ejsPath)) {
    res.render('cart', getNavData())
  } else if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath)
  } else {
    res.status(404).send('Page panier introuvable')
  }
})

// Page favoris
app.get('/favorites', (req, res) => {
  const ejsPath  = path.join(__dirname, '..', 'frontend', 'templates', 'favorites.ejs')
  const htmlPath = path.join(__dirname, '..', 'frontend', 'templates', 'favorites.html')

  if (fs.existsSync(ejsPath)) {
    res.render('favorites', getNavData())
  } else if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath)
  } else {
    res.status(404).send('Page favoris introuvable')
  }
})

// ─── Fichiers statiques ───────────────────────
// APRES les routes EJS
app.use(express.static(path.join(__dirname, '..', 'frontend')))

// ─── Démarrage ────────────────────────────────
app.listen(8080, () => {
  console.log('Serveur Konekt démarré sur http://localhost:8080')
})