const API = 'http://localhost:8080/api'

// ─── Sélecteurs DOM ─────────────────────────
const navbar         = document.querySelector('.navbar')
const btnBurger      = document.getElementById('btn-burger')
const navMenu        = document.getElementById('nav-menu')
const btnSearch       = document.getElementById('btn-search')
const btnSearchClose  = document.getElementById('btn-search-close')
const btnSearchSubmit = document.getElementById('btn-search-submit')
const searchBar       = document.getElementById('search-bar')
const searchInput     = document.getElementById('search-input')
const cartCount      = document.getElementById('cart-count')
const favCount       = document.getElementById('fav-count')

// Dropdowns
const navEhf          = document.getElementById('nav-ehf')
const navStarligue    = document.getElementById('nav-starligue')
const clubsEhf        = document.getElementById('clubs-ehf')
const clubsStarligue  = document.getElementById('clubs-starligue')

// ═══════════════════════════════════════════
// NAVBAR — scroll + burger
// ═══════════════════════════════════════════

window.addEventListener('scroll', () => {
  navbar.classList.toggle('navbar--scrolled', window.scrollY > 40)
})

if (btnBurger) {
  btnBurger.addEventListener('click', () => {
    btnBurger.classList.toggle('open')
    navMenu.classList.toggle('open')
  })
}

// Dropdowns en accordéon sur mobile (touch)
document.querySelectorAll('.nav-item').forEach(item => {
  item.querySelector('.navbar__link')?.addEventListener('click', () => {
    if (window.innerWidth > 900) return
    const isOpen = item.classList.contains('open')
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('open'))
    if (!isOpen) item.classList.add('open')
  })
})

// Ferme le menu mobile quand on clique sur un lien de page
document.querySelectorAll('.dropdown__link').forEach(link => {
  link.addEventListener('click', () => {
    navMenu?.classList.remove('open')
    btnBurger?.classList.remove('open')
  })
})

// ═══════════════════════════════════════════
// RECHERCHE
// ═══════════════════════════════════════════

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

// Redirige vers la page produits avec le terme saisi en paramètre URL
function doSearch() {
  const q = searchInput ? searchInput.value.trim() : ''
  if (q) window.location.href = `/products?search=${encodeURIComponent(q)}`
}

if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch()
  })
}

// L'icône loupe dans la barre sert aussi de bouton de soumission
if (btnSearchSubmit) {
  btnSearchSubmit.addEventListener('click', doSearch)
}

// ═══════════════════════════════════════════
// DROPDOWNS — chargement dynamique via API
// ═══════════════════════════════════════════

async function loadDropdowns() {
  try {
    const res = await fetch(`${API}/products`)
    if (!res.ok) return
    const products = await res.json()
    buildDropdown(products, 'EHF Champions League', clubsEhf, 'club')
    buildDropdown(products, 'Liqui Moly Starligue', clubsStarligue, 'club')
  } catch (err) {
    console.error('Erreur dropdowns :', err)
  }
}

// competition est un TABLEAU dans le JSON → on utilise .includes()
function buildDropdown(products, competitionLabel, container, clubKey) {
  if (!container) return

  const filtered = products.filter(p =>
    Array.isArray(p.caracteristiques.competition) &&
    p.caracteristiques.competition.includes(competitionLabel)
  )

  const clubsMap = {}
  filtered.forEach(p => {
    const nom = p.caracteristiques[clubKey]
    if (nom && nom !== 'NaN' && !clubsMap[nom]) {
      clubsMap[nom] = parseInt(p.id)
    }
  })

  const clubs = Object.entries(clubsMap)
    .sort((a, b) => a[1] - b[1])
    .map(([nom]) => nom)

  if (clubs.length === 0) {
    container.innerHTML = '<span class="dropdown__empty">Aucun club trouvé</span>'
    return
  }

  container.innerHTML = clubs.map(club =>
    `<a href="/products?club=${encodeURIComponent(club)}" class="dropdown__link">${club}</a>`
  ).join('')
}

// ═══════════════════════════════════════════
// COMPTEURS PANIER & FAVORIS
// ═══════════════════════════════════════════

async function updateCartCount() {
  try {
    const res = await fetch(`${API}/cart`)
    if (!res.ok) return
    const cart = await res.json()
    const total = cart.reduce((acc, item) => acc + item.quantite, 0)
    if (cartCount) {
      cartCount.textContent = total
      cartCount.classList.toggle('visible', total > 0)
    }
  } catch (err) {
    console.error('Erreur panier :', err)
  }
}

async function updateFavCount() {
  try {
    const res = await fetch(`${API}/favorites`)
    if (!res.ok) return
    const favorites = await res.json()
    if (favCount) {
      favCount.textContent = favorites.length
      favCount.classList.toggle('visible', favorites.length > 0)
    }
  } catch (err) {
    console.error('Erreur favoris :', err)
  }
}

// ═══════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════

async function init() {
  await Promise.all([
    updateCartCount(),
    updateFavCount(),
    loadDropdowns()
  ])
}

init()