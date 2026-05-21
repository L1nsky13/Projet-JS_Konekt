const API            = 'http://localhost:8080/api'
const ITEMS_PER_PAGE = 20

// Sélecteurs DOM
const navbar          = document.querySelector('.navbar')
const btnBurger       = document.getElementById('btn-burger')
const navMenu         = document.getElementById('nav-menu')
const btnSearch       = document.getElementById('btn-search')
const btnSearchClose  = document.getElementById('btn-search-close')
const btnSearchSubmit = document.getElementById('btn-search-submit')
const searchBar       = document.getElementById('search-bar')
const searchInput     = document.getElementById('search-input')
const cartCount       = document.getElementById('cart-count')
const favCount        = document.getElementById('fav-count')
const productsGrid    = document.getElementById('products-grid')
const loader          = document.getElementById('loader')
const resultsCount    = document.getElementById('results-count')
const sortSelect      = document.getElementById('sort-select')
const paginationEl    = document.getElementById('pagination')
const breadcrumbLabel = document.getElementById('breadcrumb-label')
const catalogueTitle  = document.getElementById('catalogue-title')
const rangeMin        = document.getElementById('range-min')
const rangeMax        = document.getElementById('range-max')
const rangeFill       = document.getElementById('range-fill')
const priceMinLabel   = document.getElementById('price-min-label')
const priceMaxLabel   = document.getElementById('price-max-label')
const btnApplyPrice   = document.getElementById('btn-apply-price')
const btnReset        = document.getElementById('btn-reset')
const sizeBtns        = document.querySelectorAll('.size-btn')
const typeBtns        = document.querySelectorAll('.type-btn')
const colorBtns       = document.querySelectorAll('.color-btn')

// État
let allProducts  = []
let filtered     = []
let favoritesIds = []
let currentPage  = 1

let activeFilters = {
  priceMin : 15,
  priceMax : 35,
  size     : null,
  type     : null,
  colors   : [],
  search   : ''
}

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
    searchInput.value    = ''
    activeFilters.search = ''
    applyFilters()
  })
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    activeFilters.search = searchInput.value.toLowerCase().trim()
    currentPage = 1
    applyFilters()
  })
}

// L'icône loupe dans la barre applique immédiatement le filtre texte
if (btnSearchSubmit) {
  btnSearchSubmit.addEventListener('click', () => {
    activeFilters.search = searchInput ? searchInput.value.toLowerCase().trim() : ''
    currentPage = 1
    applyFilters()
  })
}

// Dropdowns navbar
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

// competition est un TABLEAU dans le JSON → .some() pour matcher
function buildDropdown(products, competition, containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  const clubsMap = {}
  products.forEach(p => {
    const comps = p.caracteristiques.competition
    const club  = p.caracteristiques.club
    // On filtre les produits dont le tableau competition contient la compétition
    if (
      Array.isArray(comps) &&
      comps.some(c => c.trim().toLowerCase() === competition.trim().toLowerCase()) &&
      club && club !== 'NaN' && !clubsMap[club]
    ) {
      clubsMap[club] = parseInt(p.id)
    }
  })

  const clubs = Object.entries(clubsMap).sort((a, b) => a[1] - b[1]).map(([nom]) => nom)

  container.innerHTML = clubs.length === 0
    ? '<span class="dropdown__empty">Aucun club</span>'
    : clubs.map(club =>
        `<a href="/products?club=${encodeURIComponent(club)}" class="dropdown__link">${club}</a>`
      ).join('')
}

// CHARGEMENT PRODUITS 

async function loadProducts() {
  try {
    showLoader()
    // Vérifie le cache localStorage avant d'appeler l'API
    const cached = localStorage.getItem('konekt_products')
    if (cached) {
      allProducts = JSON.parse(cached)
    } else {
      const res = await fetch(`${API}/products`)
      if (!res.ok) throw new Error('Erreur API')
      allProducts = await res.json()
      localStorage.setItem('konekt_products', JSON.stringify(allProducts))
    }
    syncFiltersFromURL()
    applyFilters()
  } catch (err) {
    console.error('Erreur chargement produits :', err)
    productsGrid.innerHTML = `
      <p style="grid-column:1/-1;text-align:center;color:rgba(226,232,240,0.4);padding:60px 0">
        Impossible de charger les produits. Vérifie que le serveur tourne sur le port 8080.
      </p>`
  }
}

// Met à jour le titre et le fil d'ariane selon les query params de l'URL
function syncFiltersFromURL() {
  const params      = new URLSearchParams(window.location.search)
  const competition = params.get('competition')
  const pays        = params.get('pays')
  const club        = params.get('club')
  const search      = params.get('search')

  if (competition) {
    breadcrumbLabel.textContent = competition
    catalogueTitle.textContent  = competition
  } else if (pays) {
    breadcrumbLabel.textContent = `Équipe de ${pays}`
    catalogueTitle.textContent  = `Équipe de ${pays}`
  } else if (club) {
    breadcrumbLabel.textContent = club
    catalogueTitle.textContent  = club
  } else if (search) {
    activeFilters.search        = search.toLowerCase()
    searchInput.value           = search
    breadcrumbLabel.textContent = `Recherche : "${search}"`
    catalogueTitle.textContent  = `Résultats pour "${search}"`
  }
}

// FILTRAGE

function applyFilters() {
  const params      = new URLSearchParams(window.location.search)
  const competition = params.get('competition')
  const pays        = params.get('pays')
  const club        = params.get('club')

  filtered = allProducts.filter(p => {
    const comps = p.caracteristiques.competition

    // Filtre URL compétition — tableau, comparaison insensible à la casse
    if (competition && !(Array.isArray(comps) && comps.some(c =>
      c.trim().toLowerCase() === competition.trim().toLowerCase()
    ))) return false

    // Filtre URL pays
    if (pays && p.caracteristiques.pays.toLowerCase() !== pays.toLowerCase()) return false

    // Filtre URL club
    if (club && p.caracteristiques.club !== club) return false

    // Filtre prix
    if (p.prix < activeFilters.priceMin || p.prix > activeFilters.priceMax) return false

    // Filtre taille
    if (activeFilters.size && !p.caracteristiques.tailles.includes(activeFilters.size)) return false

    // Filtre type — un seul, comparaison avec normalisation des accents
    if (activeFilters.type) {
      const productType = (p.caracteristiques.type || '').toLowerCase()
      const normalize   = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (!normalize(productType).includes(normalize(activeFilters.type))) return false
    }

    // Filtre couleur — plusieurs possibles, logique OU
    if (activeFilters.colors.length > 0) {
      const productColors = p.caracteristiques.couleurs || []
      const matchColor = activeFilters.colors.some(fc =>
        productColors.some(pc => pc.toLowerCase() === fc.toLowerCase())
      )
      if (!matchColor) return false
    }

    // Filtre recherche — uniquement par nom de club
    if (activeFilters.search) {
      const q    = activeFilters.search
      const club = (p.caracteristiques.club || '').toLowerCase()
      if (!club.includes(q)) return false
    }

    return true
  })

  // Tri
  const sort = sortSelect.value
  if (sort === 'prix-asc')  filtered.sort((a, b) => a.prix - b.prix)
  if (sort === 'prix-desc') filtered.sort((a, b) => b.prix - a.prix)
  if (sort === 'nom-asc')   filtered.sort((a, b) => a.nom.localeCompare(b.nom))
  if (sort === 'nom-desc')  filtered.sort((a, b) => b.nom.localeCompare(a.nom))

  currentPage = 1
  renderPage()
}

// RENDU

function renderPage() {
  hideLoader()

  const total     = filtered.length
  const start     = (currentPage - 1) * ITEMS_PER_PAGE
  const end       = Math.min(start + ITEMS_PER_PAGE, total)
  const paginated = filtered.slice(start, end)

  resultsCount.textContent = total === 0
    ? 'Aucun résultat'
    : `Affichage de ${start + 1}–${end} sur ${total} résultat${total > 1 ? 's' : ''}`

  if (paginated.length === 0) {
    productsGrid.innerHTML = `
      <p style="grid-column:1/-1;text-align:center;color:rgba(226,232,240,0.4);padding:60px 0">
        Aucun maillot ne correspond à ta sélection.
      </p>`
    paginationEl.innerHTML = ''
    return
  }

  productsGrid.innerHTML = paginated.map(p => createCardHTML(p)).join('')

  // Attache les événements sur chaque carte
  productsGrid.querySelectorAll('.product-card').forEach(card => {
    const id = card.dataset.id

    // Clic sur la carte → page kit
    card.addEventListener('click', (e) => {
      if (e.target.closest('.product-card__fav-btn')) return
      window.location.href = `/kit?id=${id}`
    })

    // Bouton favori — bascule ajout / retrait
    const favBtn = card.querySelector('.product-card__fav-btn')
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        toggleFavorite(id, favBtn)
      })
    }

    // Bouton panier — ajoute 1 unité directement depuis la carte
    const cartBtn = card.querySelector('.product-card__cart-btn')
    if (cartBtn && !cartBtn.disabled) {
      cartBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        const product = allProducts.find(p => p.id === id)
        addToCartFromCard(cartBtn, product)
      })
    }
  })

  renderPagination()
}

// Génère le HTML d'une carte produit
function createCardHTML(product) {
  const isFav        = favoritesIds.includes(product.id)
  const isLowStock   = product.quantite_stock > 0 && product.quantite_stock <= 5
  const isOutOfStock = product.quantite_stock === 0

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-card__img-wrapper">
        <img class="product-card__img product-card__img--primary"
          src="${product.images[0]}" alt="${product.nom}" loading="lazy" />
        <img class="product-card__img product-card__img--secondary"
          src="${product.images[1] || product.images[0]}" alt="${product.nom}" loading="lazy" />

        ${isLowStock   ? `<span class="product-card__stock-badge">Dernières pièces</span>` : ''}
        ${isOutOfStock ? `<span class="product-card__stock-badge product-card__stock-badge--out">Rupture</span>` : ''}

        <button class="product-card__fav-btn ${isFav ? 'active' : ''}" aria-label="Favoris">
          <img src="/assets/icons/favori.png" alt="Favori" />
        </button>
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name">${product.nom}</h3>
        <p class="product-card__price">
          ${product.prix.toFixed(2)}<span>${product.devise}</span>
        </p>
        <button class="product-card__cart-btn" ${isOutOfStock ? 'disabled' : ''}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          ${isOutOfStock ? 'Rupture de stock' : 'Ajouter au panier'}
        </button>
      </div>
    </article>
  `
}

// Pagination
function renderPagination() {
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return }

  let html = `<button class="pagination__btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">‹</button>`

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="pagination__btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span style="color:rgba(226,232,240,0.3);padding:0 4px;line-height:36px">…</span>`
    }
  }

  html += `<button class="pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">›</button>`
  paginationEl.innerHTML = html

  paginationEl.querySelectorAll('.pagination__btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page)
      renderPage()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  })
}

// SIDEBAR — événements

// Mise à jour visuelle du slider de prix
function updateRangeFill() {
  const min   = parseInt(rangeMin.value)
  const max   = parseInt(rangeMax.value)
  const total = parseInt(rangeMin.max)
  rangeFill.style.left  = `${(min / total) * 100}%`
  rangeFill.style.width = `${((max - min) / total) * 100}%`
  priceMinLabel.textContent = `${min} €`
  priceMaxLabel.textContent = `${max} €`
}

rangeMin.addEventListener('input', () => {
  if (parseInt(rangeMin.value) > parseInt(rangeMax.value)) rangeMin.value = rangeMax.value
  updateRangeFill()
})

rangeMax.addEventListener('input', () => {
  if (parseInt(rangeMax.value) < parseInt(rangeMin.value)) rangeMax.value = rangeMin.value
  updateRangeFill()
})

btnApplyPrice.addEventListener('click', () => {
  activeFilters.priceMin = parseInt(rangeMin.value)
  activeFilters.priceMax = parseInt(rangeMax.value)
  currentPage = 1
  applyFilters()
})

// Tailles — un seul actif, reclic = désactive
sizeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const size = btn.dataset.size
    if (activeFilters.size === size) {
      activeFilters.size = null
      btn.classList.remove('active')
    } else {
      sizeBtns.forEach(b => b.classList.remove('active'))
      activeFilters.size = size
      btn.classList.add('active')
    }
    currentPage = 1
    applyFilters()
  })
})

// Types — un seul actif, reclic = désactive
typeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type
    if (activeFilters.type === type) {
      activeFilters.type = null
      btn.classList.remove('active')
    } else {
      typeBtns.forEach(b => b.classList.remove('active'))
      activeFilters.type = type
      btn.classList.add('active')
    }
    currentPage = 1
    applyFilters()
  })
})

// Couleurs — plusieurs actifs possibles, reclic = désactive
colorBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const color = btn.dataset.color
    const idx   = activeFilters.colors.indexOf(color)
    if (idx !== -1) {
      activeFilters.colors.splice(idx, 1)
      btn.classList.remove('active')
    } else {
      activeFilters.colors.push(color)
      btn.classList.add('active')
    }
    currentPage = 1
    applyFilters()
  })
})

// Tri
sortSelect.addEventListener('change', applyFilters)

// Reset complet de tous les filtres
btnReset.addEventListener('click', () => {
  activeFilters = { priceMin: 15, priceMax: 35, size: null, type: null, colors: [], search: '' }
  rangeMin.value    = 15
  rangeMax.value    = 35
  updateRangeFill()
  sizeBtns.forEach(b  => b.classList.remove('active'))
  typeBtns.forEach(b  => b.classList.remove('active'))
  colorBtns.forEach(b => b.classList.remove('active'))
  sortSelect.value  = ''
  searchInput.value = ''
  currentPage = 1
  applyFilters()
})

// PANIER & FAVORIS

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
    favoritesIds    = favorites.map(f => f.id)
    if (favCount) {
      favCount.textContent = favorites.length
      favCount.classList.toggle('visible', favorites.length > 0)
    }
  } catch (err) {}
}

// Envoie 1 unité du produit au panier et affiche un retour visuel sur le bouton
async function addToCartFromCard(btn, product) {
  if (!product) return
  btn.disabled = true

  try {
    await fetch(`${API}/cart`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        id      : product.id,
        nom     : product.nom,
        prix    : product.prix,
        image   : product.images[0],
        quantite: 1
      })
    })
    await updateCartCount()

    // Affiche ✓ Ajouté pendant 2 secondes avant de restaurer le bouton
    btn.innerHTML = '✓ Ajouté'
    btn.classList.add('added')
    setTimeout(() => {
      btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        Ajouter au panier`
      btn.classList.remove('added')
      btn.disabled = false
    }, 2000)
  } catch (err) {
    console.error('Erreur ajout au panier :', err)
    btn.disabled = false
  }
}

async function toggleFavorite(productId, btn) {
  const product = allProducts.find(p => p.id === productId)
  if (!product) return
  const isFav = favoritesIds.includes(productId)

  try {
    if (isFav) {
      await fetch(`${API}/favorites/${productId}`, { method: 'DELETE' })
    } else {
      await fetch(`${API}/favorites`, {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ id: product.id, nom: product.nom, prix: product.prix, image: product.images[0] })
      })
    }
    await updateFavCount()
    btn.classList.toggle('active', favoritesIds.includes(productId))
  } catch (err) {}
}

// UTILITAIRES

function showLoader() {
  if (loader) loader.style.display = 'flex'
  if (productsGrid) { productsGrid.innerHTML = ''; productsGrid.appendChild(loader) }
}

function hideLoader() {
  if (loader) loader.style.display = 'none'
}

// INIT

async function init() {
  updateRangeFill()
  await Promise.all([updateCartCount(), updateFavCount(), loadDropdowns()])
  await loadProducts()
}

init()