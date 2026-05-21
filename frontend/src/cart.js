const API = 'http://localhost:8080/api'

// Sélecteurs DOM
const navbar         = document.querySelector('.navbar')
const btnBurger      = document.getElementById('btn-burger')
const navMenu        = document.getElementById('nav-menu')
const btnSearch      = document.getElementById('btn-search')
const btnSearchClose = document.getElementById('btn-search-close')
const btnSearchSubmit= document.getElementById('btn-search-submit')
const searchBar      = document.getElementById('search-bar')
const searchInput    = document.getElementById('search-input')
const cartCount      = document.getElementById('cart-count')
const favCount       = document.getElementById('fav-count')

const SHIPPING        = 3.99

const cartLoader      = document.getElementById('cart-loader')
const cartEmpty       = document.getElementById('cart-empty')
const cartContent     = document.getElementById('cart-content')
const cartItemsEl     = document.getElementById('cart-items')
const cartItemsCount  = document.getElementById('cart-items-count')
const cartSubtotalEl  = document.getElementById('cart-subtotal')
const cartShippingEl  = document.getElementById('cart-shipping')
const cartTotalEl     = document.getElementById('cart-total')
const btnClearCart    = document.getElementById('btn-clear-cart')
const btnCheckout     = document.getElementById('btn-checkout')
const orderSuccess    = document.getElementById('cart-order-success')

const promoInput      = document.getElementById('promo-input')
const btnApplyPromo   = document.getElementById('btn-apply-promo')
const promoFeedback   = document.getElementById('promo-feedback')
const promoRow        = document.getElementById('promo-row')
const promoLabel      = document.getElementById('promo-label')
const promoDiscountEl = document.getElementById('promo-discount')

// Stock des articles courants du panier
let cartItems    = []
let appliedPromo = null // { code, pourcentage, type, applicableIds? }

// NAVBAR

// Classe scrolled ajoutée dès qu'on scroll de plus de 40px
window.addEventListener('scroll', () => {
  navbar.classList.toggle('navbar--scrolled', window.scrollY > 40)
})

if (btnBurger) {
  btnBurger.addEventListener('click', () => {
    btnBurger.classList.toggle('open')
    navMenu.classList.toggle('open')
  })
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.querySelector('.navbar__link')?.addEventListener('click', () => {
    if (window.innerWidth > 900) return
    const isOpen = item.classList.contains('open')
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('open'))
    if (!isOpen) item.classList.add('open')
  })
})

document.querySelectorAll('.dropdown__link').forEach(link => {
  link.addEventListener('click', () => {
    navMenu?.classList.remove('open')
    btnBurger?.classList.remove('open')
  })
})

// RECHERCHE

// Ouvre la barre de recherche et met le focus sur l'input
if (btnSearch) {
  btnSearch.addEventListener('click', () => {
    searchBar.classList.add('open')
    searchInput.focus()
  })
}

// Ferme la barre et efface l'input
if (btnSearchClose) {
  btnSearchClose.addEventListener('click', () => {
    searchBar.classList.remove('open')
    searchInput.value = ''
  })
}

// Redirige vers la page produits avec la recherche en param URL
function doSearch() {
  const q = searchInput.value.trim()
  if (q) window.location.href = `/products?search=${encodeURIComponent(q)}`
}

if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch()
  })
}

// L'icône loupe à l'intérieur de la barre sert aussi de bouton de soumission
if (btnSearchSubmit) {
  btnSearchSubmit.addEventListener('click', doSearch)
}

// CHARGEMENT DU PANIER

// Récupère le panier depuis l'API et lance le rendu
async function loadCart() {
  try {
    const res = await fetch(`${API}/cart`)
    if (!res.ok) throw new Error('Erreur API')
    cartItems = await res.json()
    renderCart()
  } catch (err) {
    console.error('Impossible de charger le panier :', err)
    cartLoader.style.display = 'none'
    cartEmpty.style.display  = 'flex'
  }
}

// RENDU

// Reconstruit l'affichage complet du panier
function renderCart() {
  cartLoader.style.display = 'none'

  if (cartItems.length === 0) {
    cartEmpty.style.display   = 'flex'
    cartContent.style.display = 'none'
    updateBadge(0)
    return
  }

  cartEmpty.style.display   = 'none'
  cartContent.style.display = 'grid'

  // Conserve l'en-tête et réinjecte les articles dessous
  const header = cartItemsEl.querySelector('.cart-cols-header')
  cartItemsEl.innerHTML = ''
  if (header) cartItemsEl.appendChild(header)

  cartItems.forEach(item => {
    const article = document.createElement('article')
    article.className  = 'cart-item'
    article.dataset.id = item.id
    article.innerHTML  = buildItemHTML(item)
    cartItemsEl.appendChild(article)
  })

  attachItemEvents()
  updateSummary()
}

// Construit le HTML d'un article du panier avec ses détails (taille, flocage)
function buildItemHTML(item) {
  const tailleHTML = item.taille
    ? `<span class="cart-item__detail">Taille : <strong>${item.taille}</strong></span>`
    : ''

  let flocageHTML = ''
  if (item.flocage && (item.flocage.nom || item.flocage.numero)) {
    const parts = [item.flocage.nom, item.flocage.numero].filter(Boolean).join(' / ')
    flocageHTML = `<span class="cart-item__detail">Flocage : <strong>${parts}</strong></span>`
  }

  // Les 5 éléments sont des enfants directs de la grille .cart-item :
  // img | info | qty | total | remove
  // Taille et flocage sont dans .cart-item__info pour que le layout mobile fonctionne
  return `
    <a href="/kit?id=${item.id}" class="cart-item__img-link">
      <img src="${item.image}" alt="${item.nom}" class="cart-item__img" />
    </a>
    <div class="cart-item__info">
      <a href="/kit?id=${item.id}" class="cart-item__name">${item.nom}</a>
      <p class="cart-item__price-unit">${item.prix.toFixed(2)} € / unité</p>
      ${tailleHTML}
      ${flocageHTML}
    </div>
    <div class="cart-item__qty">
      <button class="cart-qty-btn" data-id="${item.id}" data-action="minus" aria-label="Diminuer">−</button>
      <span class="cart-qty-val">${item.quantite}</span>
      <button class="cart-qty-btn" data-id="${item.id}" data-action="plus" aria-label="Augmenter">+</button>
    </div>
    <p class="cart-item__total">${(item.prix * item.quantite).toFixed(2)} €</p>
    <button class="cart-item__remove" data-id="${item.id}" aria-label="Supprimer">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
      </svg>
    </button>
  `
}

// Attache les événements sur les boutons quantité et suppression de chaque article
function attachItemEvents() {
  cartItemsEl.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id
      const item = cartItems.find(i => i.id === id)
      if (!item) return
      const newQty = btn.dataset.action === 'plus' ? item.quantite + 1 : item.quantite - 1
      updateQuantity(id, newQty)
    })
  })

  cartItemsEl.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', () => removeItem(btn.dataset.id))
  })
}

// Recalcule et affiche le résumé (sous-total, livraison, promo, total, compteur)
function updateSummary() {
  const subtotal = cartItems.reduce((acc, item) => acc + item.prix * item.quantite, 0)
  const totalQty = cartItems.reduce((acc, item) => acc + item.quantite, 0)

  let discount = 0
  if (appliedPromo) {
    if (appliedPromo.type === 'global') {
      discount = subtotal * (appliedPromo.pourcentage / 100)
    } else if (appliedPromo.type === 'slow_sellers' && appliedPromo.applicableIds) {
      const applicable = cartItems.filter(item => appliedPromo.applicableIds.includes(item.id))
      discount = applicable.reduce((acc, item) => acc + item.prix * item.quantite, 0) * (appliedPromo.pourcentage / 100)
    }
  }

  const total = subtotal - discount + SHIPPING

  cartItemsCount.textContent = `${totalQty} article${totalQty > 1 ? 's' : ''}`
  cartSubtotalEl.textContent = `${subtotal.toFixed(2)} €`
  if (cartShippingEl) cartShippingEl.textContent = `${SHIPPING.toFixed(2)} €`
  cartTotalEl.textContent    = `${total.toFixed(2)} €`

  if (discount > 0) {
    promoRow.style.display     = 'flex'
    promoLabel.textContent     = `"${appliedPromo.code}" (−${appliedPromo.pourcentage}%)`
    promoDiscountEl.textContent = `−${discount.toFixed(2)} €`
  } else {
    promoRow.style.display = 'none'
  }

  updateBadge(totalQty)
}

// Met à jour le badge du panier dans la navbar
function updateBadge(count) {
  if (cartCount) {
    cartCount.textContent = count
    cartCount.classList.toggle('visible', count > 0)
  }
}

// ACTIONS PANIER

// Modifie la quantité d'un article ; si <= 0 on le supprime
async function updateQuantity(id, newQty) {
  if (newQty < 1) {
    await removeItem(id)
    return
  }

  try {
    const res = await fetch(`${API}/cart/${id}`, {
      method : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ quantite: newQty })
    })
    if (!res.ok) return
    const data = await res.json()
    cartItems  = data.cart
    renderCart()
  } catch (err) {
    console.error('Erreur mise à jour quantité :', err)
  }
}

// Supprime un article du panier via son id
async function removeItem(id) {
  try {
    const res  = await fetch(`${API}/cart/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    const data = await res.json()
    cartItems  = data.cart
    renderCart()
  } catch (err) {
    console.error('Erreur suppression article :', err)
  }
}

// Vide entièrement le panier après confirmation de l'utilisateur
async function clearCart() {
  if (!confirm('Vider le panier ? Cette action est irréversible.')) return
  try {
    await fetch(`${API}/cart`, { method: 'DELETE' })
    cartItems = []
    renderCart()
  } catch (err) {
    console.error('Erreur vidage panier :', err)
  }
}

// Valide la commande : enregistre dans orders.json, vide le panier et affiche la confirmation
async function checkout() {
  btnCheckout.disabled     = true
  btnCheckout.textContent  = 'Traitement…'

  try {
    const subtotal = cartItems.reduce((acc, item) => acc + item.prix * item.quantite, 0)
    let discount = 0
    if (appliedPromo) {
      if (appliedPromo.type === 'global') {
        discount = subtotal * (appliedPromo.pourcentage / 100)
      } else if (appliedPromo.type === 'slow_sellers' && appliedPromo.applicableIds) {
        const applicable = cartItems.filter(item => appliedPromo.applicableIds.includes(item.id))
        discount = applicable.reduce((acc, item) => acc + item.prix * item.quantite, 0) * (appliedPromo.pourcentage / 100)
      }
    }
    const total = subtotal - discount + SHIPPING

    // Enregistre la commande
    const res = await fetch(`${API}/orders`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        items  : cartItems,
        total,
        devise : '€',
        promo  : appliedPromo ? { code: appliedPromo.code, pourcentage: appliedPromo.pourcentage, reduction: discount } : null
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Erreur serveur')
    }

    // Vide le panier
    await fetch(`${API}/cart`, { method: 'DELETE' })
    cartItems = []
    cartContent.style.display  = 'none'
    cartEmpty.style.display    = 'none'
    orderSuccess.style.display = 'flex'
    updateBadge(0)

  } catch (err) {
    console.error('Erreur commande :', err)
    btnCheckout.disabled    = false
    btnCheckout.textContent = 'Commander'
    alert(`Erreur : ${err.message}`)
  }
}

// CODE PROMO

async function applyPromo() {
  const code = promoInput.value.trim()
  if (!code) return

  btnApplyPromo.disabled    = true
  btnApplyPromo.textContent = '…'
  promoFeedback.textContent = ''
  promoFeedback.className   = 'cart-promo__feedback'

  try {
    const res = await fetch(`${API}/promocodes/validate`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ code, items: cartItems })
    })

    if (!res.ok) throw new Error(`Serveur : ${res.status}`)

    const data = await res.json()

    if (data.valid) {
      appliedPromo              = { ...data, code }
      promoInput.disabled       = true
      btnApplyPromo.textContent = '✓'
      promoFeedback.textContent = `Code appliqué — ${data.pourcentage}% de réduction !`
      promoFeedback.className   = 'cart-promo__feedback cart-promo__feedback--success'
    } else {
      appliedPromo              = null
      btnApplyPromo.disabled    = false
      btnApplyPromo.textContent = 'Appliquer'
      promoFeedback.textContent = data.message || 'Code invalide'
      promoFeedback.className   = 'cart-promo__feedback cart-promo__feedback--error'
    }
    updateSummary()
  } catch (err) {
    console.error('Promo error:', err)
    btnApplyPromo.disabled    = false
    btnApplyPromo.textContent = 'Appliquer'
    promoFeedback.textContent = `Erreur : ${err.message}`
    promoFeedback.className   = 'cart-promo__feedback cart-promo__feedback--error'
  }
}

if (btnApplyPromo) btnApplyPromo.addEventListener('click', applyPromo)
if (promoInput)    promoInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyPromo() })

if (btnClearCart) btnClearCart.addEventListener('click', clearCart)
if (btnCheckout)  btnCheckout.addEventListener('click', checkout)

// DROPDOWNS NAVBAR

// Charge les clubs depuis l'API et remplit les menus déroulants de la navbar
async function loadDropdowns() {
  try {
    const res = await fetch(`${API}/products`)
    if (!res.ok) return
    const products = await res.json()
    buildDropdown(products, 'EHF Champions League', 'clubs-ehf')
    buildDropdown(products, 'Liqui Moly Starligue',  'clubs-starligue')
  } catch (err) {
    console.error('Erreur dropdowns :', err)
  }
}

// Construit le contenu d'un dropdown à partir de la liste des produits
function buildDropdown(products, competition, containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  const clubsMap = {}
  products.forEach(function(p) {
    const competitions = p.caracteristiques.competition
    const club = p.caracteristiques.club
    if (Array.isArray(competitions) && competitions.includes(competition) && club && club !== 'NaN' && !clubsMap[club]) {
      clubsMap[club] = parseInt(p.id)
    }
  })

  const clubs = Object.entries(clubsMap)
    .sort(function(a, b) { return a[1] - b[1] })
    .map(function(entry) { return entry[0] })

  if (clubs.length === 0) {
    container.innerHTML = '<span class="dropdown__empty">Aucun club trouvé</span>'
    return
  }

  container.innerHTML = clubs.map(function(club) {
    return '<a href="/products?club=' + encodeURIComponent(club) + '" class="dropdown__link">' + club + '</a>'
  }).join('')
}

// COMPTEUR FAVORIS (badge navbar)

// Charge le nombre de favoris pour afficher le badge
async function updateFavCount() {
  try {
    const res       = await fetch(`${API}/favorites`)
    if (!res.ok) return
    const favorites = await res.json()
    if (favCount) {
      favCount.textContent = favorites.length
      favCount.classList.toggle('visible', favorites.length > 0)
    }
  } catch {}
}

// INITIALISATION 

async function init() {
  await updateFavCount()
  loadDropdowns()
  await loadCart()
}

init()
