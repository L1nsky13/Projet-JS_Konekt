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

const favLoader    = document.getElementById('fav-loader')
const favEmpty     = document.getElementById('fav-empty')
const favGrid      = document.getElementById('fav-grid')
const favSubtitle  = document.getElementById('fav-subtitle')

// Liste des favoris courants
let favorites = []

// NAVBAR

// Classe scrolled quand on dépasse 40px de défilement
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

// Ouvre la barre de recherche et met le focus
if (btnSearch) {
  btnSearch.addEventListener('click', () => {
    searchBar.classList.add('open')
    searchInput.focus()
  })
}

// Ferme la barre et efface le champ
if (btnSearchClose) {
  btnSearchClose.addEventListener('click', () => {
    searchBar.classList.remove('open')
    searchInput.value = ''
  })
}

// Redirige vers la page produits avec le terme de recherche
function doSearch() {
  const q = searchInput.value.trim()
  if (q) window.location.href = `/products?search=${encodeURIComponent(q)}`
}

if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch()
  })
}

// L'icône loupe dans la barre peut aussi déclencher la recherche
if (btnSearchSubmit) {
  btnSearchSubmit.addEventListener('click', doSearch)
}

// CHARGEMENT DES FAVORIS

// Récupère les favoris via l'API et lance le rendu
async function loadFavorites() {
  try {
    const res = await fetch(`${API}/favorites`)
    if (!res.ok) throw new Error('Erreur API')
    favorites = await res.json()
    renderFavorites()
  } catch (err) {
    console.error('Impossible de charger les favoris :', err)
    favLoader.style.display = 'none'
    favEmpty.style.display  = 'flex'
  }
}

// RENDU

// Reconstruit la grille des favoris
function renderFavorites() {
  favLoader.style.display = 'none'

  if (favorites.length === 0) {
    favEmpty.style.display = 'flex'
    favGrid.style.display  = 'none'
    if (favSubtitle) favSubtitle.textContent = ''
    updateFavBadge()
    return
  }

  favEmpty.style.display = 'none'
  favGrid.style.display  = 'grid'

  if (favSubtitle) {
    favSubtitle.textContent = `${favorites.length} maillot${favorites.length > 1 ? 's' : ''} sauvegardé${favorites.length > 1 ? 's' : ''}`
  }

  favGrid.innerHTML = favorites.map(item => buildCardHTML(item)).join('')

  // Attache les événements sur chaque carte
  favGrid.querySelectorAll('.fav-card__btn--remove').forEach(btn => {
    btn.addEventListener('click', () => removeFavorite(btn.dataset.id))
  })

  favGrid.querySelectorAll('.fav-card__btn--cart').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id, btn))
  })

  updateFavBadge()
}

// Génère le HTML d'une carte favori
function buildCardHTML(item) {
  return `
    <article class="fav-card" data-id="${item.id}">
      <a href="/kit?id=${item.id}" class="fav-card__img-link">
        <img src="${item.image}" alt="${item.nom}" class="fav-card__img" loading="lazy" />
        <div class="fav-card__overlay">
          <span class="fav-card__overlay-label">Voir le maillot</span>
        </div>
      </a>
      <div class="fav-card__body">
        <a href="/kit?id=${item.id}" class="fav-card__name">${item.nom}</a>
        <p class="fav-card__price">${item.prix.toFixed(2)} €</p>
        <div class="fav-card__actions">
          <button class="fav-card__btn fav-card__btn--cart" data-id="${item.id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Ajouter au panier
          </button>
          <button class="fav-card__btn fav-card__btn--remove" data-id="${item.id}" aria-label="Retirer des favoris">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  `
}

// ACTIONS FAVORIS

// Retire un produit des favoris et rafraîchit l'affichage
async function removeFavorite(id) {
  try {
    const res  = await fetch(`${API}/favorites/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    const data = await res.json()
    favorites  = data.favorites
    renderFavorites()
  } catch (err) {
    console.error('Erreur suppression favori :', err)
  }
}

// Ajoute 1 unité du favori au panier et affiche un retour visuel
async function addToCart(id, btn) {
  const item = favorites.find(f => f.id === id)
  if (!item) return

  // Désactive temporairement le bouton pour éviter les double-clics
  btn.disabled = true

  try {
    await fetch(`${API}/cart`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        id      : item.id,
        nom     : item.nom,
        prix    : item.prix,
        image   : item.image,
        quantite: 1
      })
    })

    await updateCartCount()

    // Affiche ✓ Ajouté pendant 2 secondes puis restore le bouton
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

// BADGES NAVBAR

// Met à jour le badge panier dans la navbar
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
  } catch {}
}

// Met à jour le badge favoris dans la navbar
function updateFavBadge() {
  if (favCount) {
    favCount.textContent = favorites.length
    favCount.classList.toggle('visible', favorites.length > 0)
  }
}

// INITIALISATION

async function init() {
  await updateCartCount()
  loadDropdowns()
  await loadFavorites()
}

init()
