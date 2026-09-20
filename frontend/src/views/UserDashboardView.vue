<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { useListingStore } from '../stores/listing.store';
import ListingCard from '../components/ListingCard.vue';
import api from '../services/api';
import { 
  Building, 
  FileText, 
  Heart, 
  PlusCircle, 
  Trash2, 
  Eye, 
  Phone,
  UserCheck
} from 'lucide-vue-next';

const authStore = useAuthStore();
const listingStore = useListingStore();

const activeTab = ref('listings'); // 'listings', 'requests', 'favorites'
const myRequests = ref([]);
const isLoading = ref(false);

const loadDashboardData = async () => {
  isLoading.value = true;
  try {
    await listingStore.fetchMyListings();
    await listingStore.fetchFavorites();

    const reqRes = await api.get('/requests/user/my-requests');
    myRequests.value = reqRes.data.data;
  } catch (err) {
    console.error('Erreur dashboard:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadDashboardData);

const deleteMyListing = async (id) => {
  if (confirm('Voulez-vous vraiment supprimer cette annonce ?')) {
    try {
      await api.delete(`/listings/${id}`);
      await listingStore.fetchMyListings();
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  }
};

const deleteMyRequest = async (id) => {
  if (confirm('Voulez-vous supprimer cette demande ?')) {
    try {
      await api.delete(`/requests/${id}`);
      const reqRes = await api.get('/requests/user/my-requests');
      myRequests.value = reqRes.data.data;
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <!-- Carte Profil Utilisateur -->
    <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-amber-500/20">
          {{ authStore.user?.full_name?.charAt(0) || 'U' }}
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl sm:text-2xl font-bold text-white">{{ authStore.user?.full_name }}</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {{ authStore.user?.role }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Phone class="w-3.5 h-3.5" />
            <span>{{ authStore.user?.phone }}</span>
            <span v-if="authStore.user?.email">• {{ authStore.user?.email }}</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <router-link 
          v-if="authStore.isPublisher"
          to="/publier" 
          class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Nouvelle annonce</span>
        </router-link>
      </div>
    </div>

    <!-- Onglets de Navigation -->
    <div class="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
      <button 
        @click="activeTab = 'listings'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 transition-colors',
          activeTab === 'listings' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Building class="w-4 h-4" />
        <span>Mes Annonces ({{ listingStore.myListings.length }})</span>
      </button>

      <button 
        @click="activeTab = 'requests'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 transition-colors',
          activeTab === 'requests' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <FileText class="w-4 h-4" />
        <span>Mes Recherches "Je cherche" ({{ myRequests.length }})</span>
      </button>

      <button 
        @click="activeTab = 'favorites'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 transition-colors',
          activeTab === 'favorites' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Heart class="w-4 h-4" />
        <span>Mes Favoris ({{ listingStore.favorites.length }})</span>
      </button>
    </div>

    <!-- CONTENU DES ONGLETS -->
    <!-- 1. MES ANNONCES -->
    <div v-if="activeTab === 'listings'">
      <div v-if="listingStore.myListings.length === 0" class="text-center py-16 bg-[#131d2e] border border-slate-800 rounded-3xl">
        <p class="text-slate-400 text-sm mb-4">Vous n'avez pas encore publié d'annonce immobilière.</p>
        <router-link to="/publier" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold">
          Publier votre première annonce
        </router-link>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="item in listingStore.myListings" 
          :key="item.id"
          class="bg-[#131d2e] border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3"
        >
          <div class="flex items-center justify-between">
            <span 
              :class="[
                'px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase',
                item.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                item.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              ]"
            >
              {{ item.status === 'ACTIVE' ? 'En ligne' : item.status === 'PENDING' ? 'En modération' : 'Rejetée' }}
            </span>
            <span class="text-xs text-slate-500">{{ item.commune_name }}</span>
          </div>

          <h4 class="font-bold text-white text-sm line-clamp-2">{{ item.title }}</h4>

          <div class="text-amber-400 font-extrabold text-base">
            {{ new Intl.NumberFormat('fr-FR').format(item.monthly_rent) }} FCFA
          </div>

          <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
            <router-link 
              :to="`/annonces/${item.id}`" 
              class="text-xs text-slate-300 hover:text-white flex items-center gap-1"
            >
              <Eye class="w-3.5 h-3.5" />
              <span>Voir l'annonce</span>
            </router-link>

            <button 
              @click="deleteMyListing(item.id)" 
              class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. MES RECHERCHES -->
    <div v-else-if="activeTab === 'requests'">
      <div v-if="myRequests.length === 0" class="text-center py-16 bg-[#131d2e] border border-slate-800 rounded-3xl">
        <p class="text-slate-400 text-sm mb-4">Vous n'avez aucune demande active.</p>
        <router-link to="/je-cherche" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold">
          Publier un besoin de logement
        </router-link>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="r in myRequests" 
          :key="r.id" 
          class="bg-[#131d2e] border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4"
        >
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-amber-400 font-bold">
                Budget max : {{ new Intl.NumberFormat('fr-FR').format(r.max_budget) }} FCFA
              </span>
              <span class="text-xs text-slate-400">{{ r.commune_name || 'Abidjan' }}</span>
            </div>
            <h4 class="font-bold text-white text-sm">{{ r.title }}</h4>
          </div>

          <button 
            @click="deleteMyRequest(r.id)" 
            class="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            title="Supprimer la demande"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 3. MES FAVORIS -->
    <div v-else-if="activeTab === 'favorites'">
      <div v-if="listingStore.favorites.length === 0" class="text-center py-16 bg-[#131d2e] border border-slate-800 rounded-3xl">
        <p class="text-slate-400 text-sm">Vous n'avez pas encore d'annonces favorites sauvegardées.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ListingCard 
          v-for="item in listingStore.favorites" 
          :key="item.id" 
          :listing="item"
          :is-favorite="true"
          @toggle-favorite="listingStore.toggleFavorite(item.id); listingStore.fetchFavorites()"
        />
      </div>
    </div>
  </div>
</template>
