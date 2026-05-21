const API = 'http://localhost:8080/api'

// Sélecteurs DOM
const navbar         = document.querySelector('.navbar')
const btnBurger      = document.getElementById('btn-burger')
const navMenu        = document.getElementById('nav-menu')
const btnSearch      = document.getElementById('btn-search')
const btnSearchClose = document.getElementById('btn-search-close')
const searchBar      = document.getElementById('search-bar')
const searchInput    = document.getElementById('search-input')
const cartCount      = document.getElementById('cart-count')
const favCount       = document.getElementById('fav-count')

const kitLoader      = document.getElementById('kit-loader')
const kitPage        = document.getElementById('kit-page')

const bcCompetition  = document.getElementById('bc-competition')
const bcName         = document.getElementById('bc-name')

const kitMainImg          = document.getElementById('kit-main-img')
const kitMainWrapper      = document.getElementById('kit-main-wrapper')
const carouselPrev        = document.getElementById('carousel-prev')
const carouselNext        = document.getElementById('carousel-next')
const carouselDots        = document.getElementById('kit-carousel-dots')
const kitColorsEl         = document.getElementById('kit-colors')
const kitVariantsSection  = document.getElementById('kit-variants-section')
const kitVariantsEl       = document.getElementById('kit-variants')
const kitCharsEl          = document.getElementById('kit-chars')

// Correspondance couleur → code hex pour les swatches
const COLOR_HEX = {
  'Blanc'      : '#f8fafc',
  'Noir'       : '#111827',
  'Rouge'      : '#ef4444',
  'Bleu'       : '#3b82f6',
  'Bleu marine': '#1e3a8a',
  'Jaune'      : '#eab308',
  'Vert'       : '#22c55e',
  'Violet'     : '#8b5cf6',
  'Or'         : '#d97706',
  'Orange'     : '#f97316',
  'Rose'       : '#ec4899',
  'Beige'      : '#d4b483',
  'Gris'       : '#94a3b8',
  'Marron'     : '#7c2d12',
}

const kitCompetition = document.getElementById('kit-competition')
const kitStock       = document.getElementById('kit-stock')
const kitName        = document.getElementById('kit-name')
const kitPrice       = document.getElementById('kit-price')
const kitDesc        = document.getElementById('kit-desc')
const btnDescToggle  = document.getElementById('btn-desc-toggle')

const kitSizes       = document.getElementById('kit-sizes')
const sizeError      = document.getElementById('size-error')
const btnGuide       = document.getElementById('btn-guide')
const btnGuideClose  = document.getElementById('btn-guide-close')
const sizeGuide      = document.getElementById('size-guide-overlay')

const inputNom       = document.getElementById('input-nom')
const inputNumero    = document.getElementById('input-numero')
const nomCount       = document.getElementById('nom-count')
const numeroCount    = document.getElementById('numero-count')

const qtyMinus       = document.getElementById('qty-minus')
const qtyPlus        = document.getElementById('qty-plus')
const qtyVal         = document.getElementById('qty-val')
const priceTotal     = document.getElementById('price-total')
const btnAddCart     = document.getElementById('btn-add-cart')
const kitFeedback    = document.getElementById('kit-feedback')

const similairesSection = document.getElementById('kit-similaires')
const similairesGrid    = document.getElementById('kit-similaires-grid')

// État
let product      = null
let allProducts  = []
let selectedSize = null
let quantity     = 1

// NAVBAR

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

if (btnSearch) {
  btnSearch.addEventListener('click', () => {
    searchBar.classList.add('open')
    searchInput.focus()
  })
}

if (btnSearchClose) {
  btnSearchClose.addEventListener('click', () => {
    searchBar.classList.remove('open')
    searchInput.value = ''
  })
}

// CHARGEMENT PRODUIT — tous les produits depuis l'API, filtre par ID côté client

async function loadProduct() {
  const params = new URLSearchParams(window.location.search)
  const id     = params.get('id')

  if (!id) {
    window.location.href = '/products'
    return
  }

  try {
    // Utilise le cache localStorage pour éviter un appel réseau inutile
    const cached = localStorage.getItem('konekt_products')
    if (cached) {
      allProducts = JSON.parse(cached)
    } else {
      const res = await fetch(`${API}/products`)
      if (!res.ok) throw new Error('Erreur API')
      allProducts = await res.json()
      localStorage.setItem('konekt_products', JSON.stringify(allProducts))
    }

    // Trouve le produit par ID (les IDs sont des strings dans le JSON)
    product = allProducts.find(p => String(p.id) === String(id))

    if (!product) {
      kitLoader.innerHTML = `
        <p style="color:#ef4444;font-family:var(--font-display);text-align:center">
          Produit introuvable.<br>
          <a href="/products" style="color:var(--electric)">← Retour au catalogue</a>
        </p>`
      return
    }

    renderProduct()
    loadSimilaires()

  } catch (err) {
    console.error(err)
    kitLoader.innerHTML = `
      <p style="color:#ef4444;font-family:var(--font-display);text-align:center">
        Erreur de chargement.<br>
        <a href="/products" style="color:var(--electric)">← Retour au catalogue</a>
      </p>`
  }
}

// RENDU DU PRODUIT

function renderProduct() {
  kitLoader.style.display = 'none'
  kitPage.style.display   = 'block'

  // Compétition principale
  const comps = product.caracteristiques.competition
  const comp  = Array.isArray(comps) ? comps[0] : comps

  // Fil d'ariane
  bcCompetition.textContent = comp
  bcCompetition.href        = `/products?competition=${encodeURIComponent(comp)}`
  bcName.textContent        = product.nom
  document.title            = `Konekt — ${product.nom}`

  // Galerie
  renderGallery()

  // Compétition badge
  kitCompetition.textContent = comp

  // Stock
  const stock = product.quantite_stock
  if (stock === 0) {
    kitStock.textContent = 'Rupture de stock'
    kitStock.className   = 'kit-stock out'
    btnAddCart.disabled  = true
  } else if (stock <= 5) {
    kitStock.textContent = `Plus que ${stock} en stock !`
    kitStock.className   = 'kit-stock low'
  } else {
    kitStock.textContent = `${stock} en stock`
    kitStock.className   = 'kit-stock'
  }

  // Nom
  kitName.textContent = product.nom

  // Prix
  kitPrice.textContent = `${product.prix.toFixed(2)} ${product.devise}`

  // Description tronquée à 150 caractères
  const fullDesc = product.description || ''
  if (fullDesc.length > 150) {
    kitDesc.textContent = fullDesc.slice(0, 150) + '…'
    btnDescToggle.style.display = 'inline-block'

    btnDescToggle.addEventListener('click', () => {
      const expanded = kitDesc.classList.toggle('expanded')
      kitDesc.textContent     = expanded ? fullDesc : fullDesc.slice(0, 150) + '…'
      btnDescToggle.textContent = expanded ? 'Réduire ↑' : 'Lire la suite ↓'
    })
  } else {
    kitDesc.textContent = fullDesc
    btnDescToggle.style.display = 'none'
  }

  // Tailles
  renderSizes()

  // Couleurs, variantes, caractéristiques
  renderColors()
  renderChars()
  renderVariants()

  // Prix total initial
  updateTotal()
}

// Couleurs
function renderColors() {
  const couleurs = product.caracteristiques.couleurs || []
  kitColorsEl.innerHTML = couleurs.map(c => {
    const hex = COLOR_HEX[c] || '#64748b'
    const border = c === 'Blanc' ? '1px solid rgba(226,232,240,0.3)' : 'none'
    return `<span class="kit-swatch" style="background:${hex};outline:${border}" title="${c}"></span>
            <span class="kit-swatch-label">${c}</span>`
  }).join('')
}

// Caractéristiques
function renderChars() {
  const c = product.caracteristiques
  const rows = [
    { label: 'Type',     value: c.type },
    { label: 'Genre',    value: c.genre },
    { label: 'Matière',  value: c.matiere },
    { label: 'Pays',     value: c.pays },
  ]
  kitCharsEl.innerHTML = rows
    .filter(r => r.value)
    .map(r => `
      <div class="kit-char">
        <dt class="kit-char__label">${r.label}</dt>
        <dd class="kit-char__value">${r.value}</dd>
      </div>`)
    .join('')
}

// Variantes du même club
function renderVariants() {
  const club = product.caracteristiques.club
  if (!club) return

  const variants = allProducts.filter(p =>
    String(p.id) !== String(product.id) &&
    p.caracteristiques.club === club
  )

  if (variants.length === 0) return

  kitVariantsSection.style.display = 'block'
  kitVariantsEl.innerHTML = variants.map(p => `
    <a href="/kit?id=${p.id}" class="kit-variant-btn ${String(p.id) === String(product.id) ? 'active' : ''}">
      <span class="kit-variant-btn__swatches">
        ${(p.caracteristiques.couleurs || []).slice(0, 3).map(c => {
          const hex = COLOR_HEX[c] || '#64748b'
          const border = c === 'Blanc' ? '1px solid rgba(226,232,240,0.3)' : 'none'
          return `<span class="kit-swatch kit-swatch--sm" style="background:${hex};outline:${border}"></span>`
        }).join('')}
      </span>
      <span class="kit-variant-btn__label">${p.caracteristiques.type || p.nom}</span>
    </a>
  `).join('')
}

// Galerie
function renderGallery() {
  const images = product.images || []
  if (images.length === 0) return

  let currentIndex = 0

  kitMainImg.src = images[0]
  kitMainImg.alt = product.nom

  // Masque flèches et dots si une seule image
  if (images.length <= 1) {
    carouselPrev.style.display = 'none'
    carouselNext.style.display = 'none'
    return
  }

  // Créer les dots
  carouselDots.innerHTML = images.map((_, i) => `
    <button class="kit-carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Vue ${i + 1}"></button>
  `).join('')

  carouselDots.querySelectorAll('.kit-carousel-dot').forEach(dot => {
    dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index)))
  })

  function goTo(index) {
    currentIndex = index
    kitMainImg.style.opacity = '0'
    setTimeout(() => {
      kitMainImg.src = images[index]
      kitMainImg.style.opacity = '1'
    }, 150)
    carouselDots.querySelectorAll('.kit-carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === index)
    })
    carouselPrev.disabled = index <= 0
    carouselNext.disabled = index >= images.length - 1
  }

  carouselPrev.addEventListener('click', () => {
    if (currentIndex > 0) goTo(currentIndex - 1)
  })

  carouselNext.addEventListener('click', () => {
    if (currentIndex < images.length - 1) goTo(currentIndex + 1)
  })

  // État initial des flèches
  carouselPrev.disabled = true
  carouselNext.disabled = images.length <= 1
}


// Tailles
function renderSizes() {
  const tailles = product.caracteristiques.tailles || []
  kitSizes.innerHTML = tailles.map(t => `
    <button class="kit-size-btn" data-size="${t}">${t}</button>
  `).join('')

  const btns = kitSizes.querySelectorAll('.kit-size-btn')

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      selectedSize = btn.dataset.size
      sizeError.style.display = 'none'
    })
  })

  // Pré-sélectionne la première taille pour que le bouton panier fonctionne immédiatement
  if (btns.length > 0) {
    btns[0].classList.add('active')
    selectedSize = btns[0].dataset.size
  }
}

// Guide des tailles
btnGuide.addEventListener('click', () => {
  sizeGuide.classList.add('open')
  document.body.style.overflow = 'hidden'
})

btnGuideClose.addEventListener('click', closeGuide)

sizeGuide.addEventListener('click', (e) => {
  if (e.target === sizeGuide) closeGuide()
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeGuide()
})

function closeGuide() {
  sizeGuide.classList.remove('open')
  document.body.style.overflow = ''
}

// Flocage — compteurs
inputNom.addEventListener('input', () => {
  inputNom.value = inputNom.value.toUpperCase()
  nomCount.textContent = `${inputNom.value.length}/12`
  updateTotal()
})

inputNumero.addEventListener('input', () => {
  inputNumero.value = inputNumero.value.replace(/[^0-9]/g, '')
  numeroCount.textContent = `${inputNumero.value.length}/2`
  updateTotal()
})

// Quantité
qtyMinus.addEventListener('click', () => {
  if (quantity > 1) {
    quantity--
    qtyVal.textContent = quantity
    updateTotal()
  }
})

qtyPlus.addEventListener('click', () => {
  if (!product) return
  if (quantity < product.quantite_stock) {
    quantity++
    qtyVal.textContent = quantity
    updateTotal()
  }
})

// Calcul prix total
function updateTotal() {
  if (!product) return
  let total = product.prix
  if (inputNom.value.trim().length > 0)    total += 1.99
  if (inputNumero.value.trim().length > 0) total += 1.99
  total *= quantity
  priceTotal.textContent = `${total.toFixed(2)} ${product.devise}`
}

// AJOUTER AU PANIER

btnAddCart.addEventListener('click', async () => {

  // Validation taille obligatoire
  if (!selectedSize) {
    sizeError.style.display = 'block'
    kitSizes.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  btnAddCart.disabled = true
  btnAddCart.textContent = 'Ajout en cours…'

  // Calcul prix unitaire avec flocage
  let totalUnitaire = product.prix
  if (inputNom.value.trim().length > 0)    totalUnitaire += 1.99
  if (inputNumero.value.trim().length > 0) totalUnitaire += 1.99

  const cartItem = {
    id      : product.id,
    nom     : product.nom,
    prix    : totalUnitaire,
    image   : product.images[0],
    taille  : selectedSize,
    flocage : {
      nom    : inputNom.value.trim()    || null,
      numero : inputNumero.value.trim() || null
    },
    quantite: quantity
  }

  try {
    const res = await fetch(`${API}/cart`, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify(cartItem)
    })

    if (!res.ok) throw new Error('Erreur ajout panier')

    // Met à jour le stock côté API
    await fetch(`${API}/products/${product.id}/stock`, {
      method  : 'PATCH',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({ quantite: quantity })
    })

    showFeedback(`✓ ${quantity} maillot${quantity > 1 ? 's' : ''} ajouté${quantity > 1 ? 's' : ''} au panier !`, 'success')
    updateCartCount()

  } catch (err) {
    showFeedback('Une erreur est survenue. Réessaie.', 'error')
  } finally {
    btnAddCart.disabled = false
    btnAddCart.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      Ajouter au panier`
  }
})

function showFeedback(msg, type) {
  kitFeedback.textContent   = msg
  kitFeedback.className     = `kit-feedback ${type}`
  kitFeedback.style.display = 'block'
  setTimeout(() => { kitFeedback.style.display = 'none' }, 4000)
}

// PRODUITS SIMILAIRES — même compétition ou même pays, hors produit actuel

function loadSimilaires() {
  const comp  = Array.isArray(product.caracteristiques.competition)
    ? product.caracteristiques.competition[0]
    : product.caracteristiques.competition
  const pays  = product.caracteristiques.pays

  // Filtre : même compétition OU même pays, et pas le produit lui-même
  const similaires = allProducts
    .filter(p => {
      if (String(p.id) === String(product.id)) return false
      const pComps = Array.isArray(p.caracteristiques.competition)
        ? p.caracteristiques.competition
        : [p.caracteristiques.competition]
      return pComps.includes(comp) || p.caracteristiques.pays === pays
    })
    .slice(0, 4)

  if (similaires.length === 0) return

  similairesSection.style.display = 'block'
  similairesGrid.innerHTML = similaires.map(p => `
    <article class="kit-sim-card" onclick="window.location.href='/kit?id=${p.id}'">
      <img class="kit-sim-card__img" src="${p.images[0]}" alt="${p.nom}" loading="lazy" />
      <div class="kit-sim-card__body">
        <h3 class="kit-sim-card__name">${p.nom}</h3>
        <p class="kit-sim-card__price">${p.prix.toFixed(2)} ${p.devise}</p>
      </div>
    </article>
  `).join('')
}

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

// PANIER & FAVORIS — compteurs navbar

async function updateCartCount() {
  try {
    const res  = await fetch(`${API}/cart`)
    if (!res.ok) return
    const cart = await res.json()
    const total = cart.reduce((acc, item) => acc + item.quantite, 0)
    if (cartCount) {
      cartCount.textContent = total
      cartCount.classList.toggle('visible', total > 0)
    }
  } catch (err) {}
}

async function updateFavCount() {
  try {
    const res       = await fetch(`${API}/favorites`)
    if (!res.ok) return
    const favorites = await res.json()
    if (favCount) {
      favCount.textContent = favorites.length
      favCount.classList.toggle('visible', favorites.length > 0)
    }
  } catch (err) {}
}

// INIT

async function init() {
  await Promise.all([updateCartCount(), updateFavCount()])
  loadDropdowns()
  await loadProduct()
}

init()