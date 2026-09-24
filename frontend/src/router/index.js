import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

// Import dynamique des vues
const HomeView = () => import('../views/HomeView.vue');
const ListingsView = () => import('../views/ListingsView.vue');
const ListingDetailView = () => import('../views/ListingDetailView.vue');
const RequestsView = () => import('../views/RequestsView.vue');
const CreateListingView = () => import('../views/CreateListingView.vue');
const LoginView = () => import('../views/LoginView.vue');
const RegisterView = () => import('../views/RegisterView.vue');
const UserDashboardView = () => import('../views/UserDashboardView.vue');
const AdminDashboardView = () => import('../views/AdminDashboardView.vue');

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { title: 'Trouve Maison CI | Immobilier & Location à Abidjan', description: 'Trouvez une maison, un appartement, un studio ou une villa à louer à Abidjan.' },
  },
  {
    path: '/annonces',
    name: 'Listings',
    component: ListingsView,
    meta: { title: 'Annonces immobilières à Abidjan | Trouve Maison CI', description: 'Explorez les maisons, appartements, studios et villas disponibles à la location à Abidjan.' },
  },
  {
    path: '/annonces/:id',
    name: 'ListingDetail',
    component: ListingDetailView,
    meta: { title: 'Détail de l\'annonce | Trouve Maison CI' },
  },
  {
    path: '/je-cherche',
    name: 'Requests',
    component: RequestsView,
    meta: { title: 'Demandes Locataires ("Je cherche") | Trouve Maison CI' },
  },
  {
    path: '/publier',
    name: 'CreateListing',
    component: CreateListingView,
    meta: {
      requiresAuth: true,
      roles: ['LANDLORD', 'AGENT', 'ADMIN'],
      title: 'Publier une annonce | Trouve Maison CI',
    },
  },
  {
    path: '/connexion',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true, title: 'Connexion | Trouve Maison CI' },
  },
  {
    path: '/inscription',
    name: 'Register',
    component: RegisterView,
    meta: { guestOnly: true, title: 'Créer un compte | Trouve Maison CI' },
  },
  {
    path: '/mon-espace',
    name: 'UserDashboard',
    component: UserDashboardView,
    meta: { requiresAuth: true, title: 'Mon Espace | Trouve Maison CI' },
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboardView,
    meta: {
      requiresAuth: true,
      roles: ['ADMIN'],
      title: 'Super Admin | Trouve Maison CI',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  },
});

// Guard de navigation globale
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Mise à jour du titre
  if (to.meta.title) document.title = to.meta.title;
  const description = to.meta.description || 'Trouvez et publiez des annonces immobilières à Abidjan sur Trouve Maison CI.';
  let descriptionTag = document.querySelector('meta[name="description"]');
  if (!descriptionTag) {
    descriptionTag = document.createElement('meta');
    descriptionTag.name = 'description';
    document.head.appendChild(descriptionTag);
  }
  descriptionTag.content = description;

  // Rediriger les utilisateurs déjà connectés hors de login/register
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'Home' });
  }

  // Vérifier l'authentification obligatoire
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // Vérifier les permissions de rôles (RBAC)
  if (to.meta.roles && to.meta.roles.length > 0) {
    const userRole = authStore.user?.role;
    if (!to.meta.roles.includes(userRole)) {
      alert('Accès refusé. Vous n\'avez pas les droits nécessaires pour cette section.');
      return next({ name: 'Home' });
    }
  }

  next();
});

export default router;
