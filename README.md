# 🇨🇮 Trouve Maison CI - Plateforme Immobilière & Location (Abidjan)

Application web complète de mise en relation immobilière adaptée aux réalités de la Côte d'Ivoire (Abidjan) :
- **Transparence sur les cautions & avances** (calcul des mois de caution, avance et démarcheur en FCFA).
- **Compteurs d'énergie et d'eau** (CIE carte prépayée / sous-compteur, SODECI individuel / partagé).
- **Mise en relation directe par WhatsApp** avec message pré-formaté.
- **Section communautaire "Je cherche"** pour les besoins urgents des locataires.
- **Contrôle d'accès par rôles (RBAC)** : Chercheur (`USER`), Propriétaire (`LANDLORD`), Démarcheur (`AGENT`), Super Admin (`ADMIN`).

---

## 🏗️ Architecture du Projet

```
trouve-maison-ci/
├── backend/                       # API REST Express.js + PostgreSQL (Neon)
│   ├── database/
│   │   ├── schema.sql             # Schéma PostgreSQL (Enums, Tables, Index)
│   │   ├── seed.sql               # Communes d'Abidjan & annonces de test
│   │   └── migrate.js             # Script d'initialisation en 1 commande
│   ├── src/
│   │   ├── config/                # Connexion DB (SSL Neon) & variables d'environnement
│   │   ├── controllers/           # Logique métier (Auth, Listings, Requests, Locations, Admin)
│   │   ├── middlewares/           # JWT, rôles RBAC, gestion d'erreurs
│   │   ├── routes/                # Routes d'API /api/*
│   │   └── server.js              # Point d'entrée serveur Express
│   ├── package.json
│   └── .env.example
│
└── frontend/                      # Application Vue.js 3 (Composition API + Vite)
    ├── src/
    │   ├── components/            # Cartes d'annonces, boutons WhatsApp, Navbar, Footer
    │   ├── views/                 # Accueil, Catalogue, Détail bien, "Je cherche", Espace perso, Admin
    │   ├── stores/                # Pinia (Auth, Listings, Locations)
    │   ├── services/              # Client Axios avec interceptor JWT
    │   ├── router/                # Vue Router avec navigation guards RBAC
    │   ├── App.vue
    │   └── main.js
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🚀 Démarrage Rapide

### 1. Configuration de la Base de Données (PostgreSQL Neon)

1. Créez un projet gratuit sur [Neon.tech](https://neon.tech).
2. Copiez votre URL de connexion PostgreSQL (assurez-vous que `?sslmode=require` est inclus).
3. Dans le dossier `backend/` :
   ```bash
   cd backend
   copy .env.example .env
   ```
4. Éditez le fichier `.env` pour y coller votre `DATABASE_URL` :
   ```env
   DATABASE_URL=postgresql://neondb_owner:votre_mot_de_passe@ep-sample.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Installez les dépendances et initialisez la base de données (création des tables et données de test d'Abidjan) :
   ```bash
   npm install
   npm run db:init
   ```

### 2. Lancement du Backend (Express.js)

Toujours dans le dossier `backend/` :
```bash
npm run dev
```
Le serveur démarrera sur **`http://localhost:5000`**.
Vérifiez l'état de l'API : [http://localhost:5000/api/health](http://localhost:5000/api/health).

---

### 3. Lancement du Frontend (Vue.js 3 + Vite)

Dans un nouveau terminal :
```bash
cd frontend
npm install
npm run dev
```
L'interface web sera accessible sur **`http://localhost:5173`**.

---

## 🔑 Comptes de Démonstration (Pré-configurés)

Le mot de passe pour tous les comptes pré-créés par `seed.sql` est : **`Password123!`**

| Rôle | Identifiant / Téléphone | Email | Droits |
|---|---|---|---|
| **Super Admin** | `+2250700000001` | `admin@trouvemaison.ci` | Accès au Back-Office `/admin`, modération, gestion utilisateurs |
| **Bailleur (Propriétaire)** | `+2250700000002` | `bailleur@trouvemaison.ci` | Publication d'annonces `/publier`, gestion de ses biens |
| **Démarcheur (Agent)** | `+2250500000003` | `agent@trouvemaison.ci` | Publication d'annonces, contact direct locataires |
| **Chercheur (Locataire)** | `+2250100000004` | `chercheur@trouvemaison.ci` | Publication de besoins dans "Je cherche", favoris |

---

## 📡 Endpoints API Principaux

### Authentification (`/api/auth`)
- `POST /api/auth/register` : Inscription par téléphone (ou email) + mot de passe.
- `POST /api/auth/login` : Connexion (JWT).
- `GET /api/auth/me` : Profil de l'utilisateur connecté.
- `PUT /api/auth/me` : Mise à jour du profil.

### Annonces Immobilières (`/api/listings`)
- `GET /api/listings` : Recherche multi-critères (`commune_id`, `property_type`, `min_price`, `max_price`, `bedrooms`, `is_furnished`, `search`).
- `GET /api/listings/:id` : Détail complet de l'annonce avec images et contacts.
- `POST /api/listings` : Publication d'annonce (réservé à `LANDLORD`, `AGENT`, `ADMIN`).
- `PUT /api/listings/:id` : Modification de son annonce.
- `DELETE /api/listings/:id` : Suppression.
- `POST /api/listings/:id/favorite` : Ajout / Retrait des favoris.
- `GET /api/listings/user/my-listings` : Liste des annonces de l'utilisateur connecté.

### Demandes Locataires "Je cherche" (`/api/requests`)
- `GET /api/requests` : Flux public des recherches locataires avec filtres.
- `POST /api/requests` : Publier son besoin de logement (utilisateur connecté).
- `DELETE /api/requests/:id` : Supprimer sa demande.

### Référentiels Géographiques (`/api/locations`)
- `GET /api/locations/cities` : Liste des villes.
- `GET /api/locations/communes` : Communes d'Abidjan (Cocody, Yopougon, Marcory, Plateau, Bingerville, etc.).
- `GET /api/locations/neighborhoods/:commune_id` : Quartiers d'une commune (Angré, Riviera, Niangon, Biétry, etc.).

### Back-Office Modération (`/api/admin`)
*(Protégé par le rôle ADMIN)*
- `GET /api/admin/stats` : Statistiques de la plateforme.
- `GET /api/admin/listings/pending` : Annonces en attente de modération.
- `PUT /api/admin/listings/:id/moderate` : Approuver (`ACTIVE`) ou rejeter (`REJECTED`) une annonce.
- `GET /api/admin/users` : Liste complète des utilisateurs.
- `PUT /api/admin/users/:id/role` : Modifier le rôle d'un utilisateur.
- `PUT /api/admin/users/:id/status` : Activer / Suspendre un compte.

## Déploiement Render + Vercel

Backend (Render) : définissez `NODE_ENV=production`, `DATABASE_URL`, `CLIENT_URL` (l'URL Vercel, ou plusieurs URLs séparées par des virgules), `JWT_SECRET` et un `DEFAULT_ADMIN_PASSWORD` robuste. Le premier démarrage vérifie les communes et crée l'admin si nécessaire ; vous pouvez aussi exécuter `npm run seed` après `npm run db:init`.

Frontend (Vercel) : définissez `VITE_API_URL=https://trouve-maison-ci.onrender.com/api`, puis redéployez. Les previews `https://*.vercel.app` sont acceptées par le CORS ; n'ajoutez pas de slash final à l'URL API.

Les chemins d'image relatifs (`/uploads/...`) et les anciennes URLs `localhost` sont automatiquement résolus vers le backend. Les fichiers présents dans `backend/uploads` sont servis par Express, mais le disque Render est éphémère : utilisez Cloudinary ou S3 pour les nouvelles images à conserver entre les redéploiements.