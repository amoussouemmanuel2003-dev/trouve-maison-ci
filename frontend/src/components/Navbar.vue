<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { 
  Home, 
  Search, 
  PlusCircle, 
  User, 
  LogOut, 
  Shield, 
  Menu, 
  X,
  FileText,
  Building
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const mobileMenuOpen = ref(false);
const profileDropdownOpen = ref(false);

const handleLogout = () => {
  authStore.logout();
  profileDropdownOpen.value = false;
  router.push('/');
};
</script>

<template>
  <header class="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-18">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Building class="w-6 h-6" />
          </div>
          <div class="flex flex-col">
            <span class="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
              Trouve Maison <span class="text-[#FF8200]">CI</span>
            </span>
            <span class="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Abidjan Immobilier</span>
          </div>
        </router-link>

        <!-- Navigation Desktop -->
        <nav class="hidden md:flex items-center gap-1 text-sm font-medium">
          <router-link 
            to="/annonces" 
            class="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2"
          >
            <Search class="w-4 h-4 text-amber-500" />
            <span>Nos Annonces</span>
          </router-link>

          <router-link 
            to="/je-cherche" 
            class="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2"
          >
            <FileText class="w-4 h-4 text-emerald-500" />
            <span>Je cherche (Locataires)</span>
          </router-link>

          <!-- Bouton Publier une annonce (Propriétaire / Démarcheur / Client) ou Administration (Admin) -->
          <router-link 
            v-if="authStore.isPublisher"
            to="/publier" 
            class="ml-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <PlusCircle class="w-4 h-4" />
            <span>Publier une annonce</span>
          </router-link>

          <router-link 
            v-else-if="authStore.isAdmin"
            to="/admin" 
            class="ml-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold flex items-center gap-2 shadow-md shadow-rose-500/20 transition-all active:scale-95"
          >
            <Shield class="w-4 h-4" />
            <span>Administration</span>
          </router-link>
        </nav>

        <!-- Espace Utilisateur Desktop -->
        <div class="hidden md:flex items-center gap-3">
          <template v-if="authStore.isAuthenticated">
            <div class="relative">
              <button 
                @click="profileDropdownOpen = !profileDropdownOpen" 
                class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-sm font-medium text-slate-200 transition-colors"
              >
                <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  {{ authStore.user?.full_name?.charAt(0) || 'U' }}
                </div>
                <span class="max-w-[120px] truncate">{{ authStore.user?.full_name }}</span>
                <span 
                  v-if="authStore.user?.role === 'ADMIN'" 
                  class="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-500/20 text-rose-400 border border-rose-500/30"
                >
                  Admin
                </span>
                <span 
                  v-else-if="authStore.user?.role === 'LANDLORD'" 
                  class="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30"
                >
                  Bailleur
                </span>
                <span 
                  v-else-if="authStore.user?.role === 'AGENT'" 
                  class="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                >
                  Agent
                </span>
              </button>

              <!-- Dropdown Menu -->
              <div 
                v-if="profileDropdownOpen" 
                @click="profileDropdownOpen = false"
                class="absolute right-0 mt-2 w-56 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-sm"
              >
                <div class="px-4 py-2 border-b border-slate-700 text-xs text-slate-400">
                  Connecté en tant que <br>
                  <strong class="text-white">{{ authStore.user?.phone }}</strong>
                </div>

                <router-link 
                  to="/mon-espace" 
                  class="flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-slate-700/60"
                >
                  <User class="w-4 h-4 text-amber-400" />
                  <span>{{ authStore.user?.role === 'USER' ? 'Mon Espace (Mes besoins)' : 'Mon Espace (Mes annonces)' }}</span>
                </router-link>

                <router-link 
                  v-if="authStore.isAdmin" 
                  to="/admin" 
                  class="flex items-center gap-2.5 px-4 py-2 text-rose-300 hover:bg-slate-700/60"
                >
                  <Shield class="w-4 h-4 text-rose-400" />
                  <span>Panneau Super Admin</span>
                </router-link>

                <div class="border-t border-slate-700 my-1"></div>

                <button 
                  @click="handleLogout" 
                  class="w-full flex items-center gap-2.5 px-4 py-2 text-left text-red-400 hover:bg-red-500/10"
                >
                  <LogOut class="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <router-link 
              to="/connexion" 
              class="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2"
            >
              Connexion
            </router-link>
            <router-link 
              to="/inscription" 
              class="text-sm font-semibold text-slate-900 bg-white hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              Inscription
            </router-link>
          </template>
        </div>

        <!-- Bouton Burger Mobile -->
        <div class="flex md:hidden items-center gap-2">
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen" 
            class="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Menu Mobile Dropdown -->
    <div v-if="mobileMenuOpen" class="md:hidden bg-[#0f172a] border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
      <router-link 
        @click="mobileMenuOpen = false" 
        to="/annonces" 
        class="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
      >
        🔍 Nos Annonces
      </router-link>
      <router-link 
        @click="mobileMenuOpen = false" 
        to="/je-cherche" 
        class="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
      >
        📝 Je cherche (Locataires)
      </router-link>
      <router-link 
        v-if="authStore.isPublisher"
        @click="mobileMenuOpen = false" 
        to="/publier" 
        class="block px-3 py-2 rounded-lg text-base font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20"
      >
        ➕ Publier une annonce
      </router-link>
      <router-link 
        v-else-if="authStore.isAdmin"
        @click="mobileMenuOpen = false" 
        to="/admin" 
        class="block px-3 py-2 rounded-lg text-base font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20"
      >
        🛡️ Panneau Administration
      </router-link>

      <div class="border-t border-slate-800 pt-3">
        <template v-if="authStore.isAuthenticated">
          <router-link 
            @click="mobileMenuOpen = false" 
            to="/mon-espace" 
            class="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            👤 Mon Espace ({{ authStore.user?.full_name }})
          </router-link>
          <router-link 
            v-if="authStore.isAdmin" 
            @click="mobileMenuOpen = false" 
            to="/admin" 
            class="block px-3 py-2 rounded-lg text-base font-medium text-rose-400 hover:bg-slate-800"
          >
            🛡️ Administration
          </router-link>
          <button 
            @click="handleLogout(); mobileMenuOpen = false" 
            class="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10"
          >
            🚪 Déconnexion
          </button>
        </template>
        <template v-else>
          <router-link 
            @click="mobileMenuOpen = false" 
            to="/connexion" 
            class="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Connexion
          </router-link>
          <router-link 
            @click="mobileMenuOpen = false" 
            to="/inscription" 
            class="block px-3 py-2 rounded-lg text-base font-medium text-amber-400 hover:bg-slate-800"
          >
            Créer un compte
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>
