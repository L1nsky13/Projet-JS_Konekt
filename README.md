# Konekt
 
Site e-commerce de maillots de handball de clubs européens (EHF Champions League & Liqui Moly StarLigue) en s'inspirant de 2 sites d'e-commerce : [http://maxikits.com]Maxikits (Site de vente de maillots de foot à prix réduits) et [http://www.weplayhandball.com] WePlayHandball (Site de vente d'équiments de handball).
 
## Stack technique
 
- **Backend** : Node.js (module `http` natif, sans framework)
- **Frontend** : HTML5, CSS3, JavaScript vanilla (ES6+)
- **Données** : fichiers JSON (pas de base de données)
- **Port** : 8080
 
## Structure du projet
 
```
Projet-JS_Konekt/
├── backend/
│   ├── server.js          # Serveur HTTP Node.js
│   ├── package.json
│   └── data/
│       ├── products.json  # Catalogue des maillots
│       ├── cart.json      # Panier
│       ├── favorites.json # Favoris
│       ├── orders.json    # Historique des commandes
│       └── promocodes.json
└── frontend/
    ├── templates/         # Pages HTML
    │   ├── index.html
    │   ├── products.html
    │   ├── kit.html
    │   ├── cart.html
    │   └── favorites.html
    ├── src/               # Scripts JS par page
    └── assets/            # CSS, images, icônes, polices
```
 
## Lancer le projet
 
```bash
cd backend
npm install
npm start
```
 
Ouvrir [http://localhost:8080](http://localhost:8080) dans le navigateur.
 
## Fonctionnalités
 
### Catalogue (`/products`)
- Filtres par prix, taille, type, couleur
- Tri par prix ou nom
- Pagination (20 articles par page)
- Recherche par nom de club
- Badges stock (dernières pièces / rupture)
 
### Fiche produit (`/kit`)
- Galerie d'images avec carrousel
- Sélection de taille (obligatoire)
- Flocage personnalisé : nom (12 car. max) et numéro (+1,99 € chacun)
- Sélecteur de quantité borné au stock disponible
- Produits similaires et variantes de couleur
 
### Panier (`/cart`)
- Ajout, modification de quantité, suppression
- Frais de port : 3,99 €
- Codes promo : réduction globale ou sur les produits en stock
- Passage de commande avec décompte du stock
 
### Favoris (`/favorites`)
- Sauvegarde de produits
- Ajout au panier depuis la liste
 
## API
 
Base : `http://localhost:8080/api`
 
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/products` | Liste des produits |
| PATCH | `/products/:id/stock` | Mise à jour du stock |
| GET / POST / DELETE | `/cart` | Gestion du panier |
| PUT / DELETE | `/cart/:id` | Modifier / supprimer un article |
| GET / POST / DELETE | `/favorites` | Gestion des favoris |
| GET / POST | `/orders` | Commandes |
| GET / DELETE | `/orders/:id` | Détail / annulation d'une commande |
| POST | `/promocodes/validate` | Validation d'un code promo |
 
## Codes promo disponibles
 
| Code | Réduction | Type |
|------|-----------|------|
| Adib30 | 30 % | Global |
| Najman50 | 50 % | slow_sellers |
| Vitolemeilleurdesmentors55 | 55 % | Global |
| stars07 | 20 % | Global |
| pu587 | 10 % | Global |
| yacin111 | 40 % | Global |
| Vito15 | 15 % | Global |
| Cyril25 | 25 % | Global |
| Vito35 | 35 % | Global |
| Vitometsnous20sur20stp70 | 70 % | Global |
 
*(voir `backend/data/promocodes.json` pour la liste complète)*