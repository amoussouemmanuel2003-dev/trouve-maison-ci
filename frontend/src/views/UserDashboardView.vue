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
  Rocket,
  Star,
  CheckCircle2,
  X,
  Smartphone
} from 'lucide-vue-next';

const authStore = useAuthStore();
const listingStore = useListingStore();

const activeTab = ref('listings'); // 'listings', 'requests', 'favorites'
const myRequests = ref([]);
const isLoading = ref(false);

// Modal de boost
const showBoostModal = ref(false);
const selectedListingForBoost = ref(null);
const paymentMethod = ref('WAVE'); // 'WAVE', 'ORANGE', 'MTN'
const transactionId = ref('');
const boostSuccess = ref(false);

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

const openBoostModal = (listing) => {
  selectedListingForBoost.value = listing;
  transactionId.value = '';
  boostSuccess.value = false;
  showBoostModal.value = true;
};

const submitBoostRequest = () => {
  if (!transactionId.value) {
    alert('Veuillez saisir votre numéro d\'expéditeur ou l\'ID de la transaction.');
    return;
  }
  boostSuccess.value = true;
};

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
          class="bg-[#131d2e] border border-slate-800 rounded-2xl overflow-hidden p-5 space-y-4 shadow-lg flex flex-col justify-between"
        >
          <div class="space-y-3">
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
              <span 
                v-if="item.is_featured" 
                class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm"
              >
                <Star class="w-3 h-3 fill-current" />
                <span>À la une</span>
              </span>
            </div>

            <h4 class="font-bold text-white text-sm line-clamp-2">{{ item.title }}</h4>

            <div class="text-amber-400 font-black text-base">
              {{ new Intl.NumberFormat('fr-FR').format(item.monthly_rent) }} FCFA
            </div>
          </div>

          <div class="space-y-3 pt-3 border-t border-slate-800">
            <!-- Bouton Booster -->
            <button 
              v-if="!item.is_featured"
              @click="openBoostModal(item)"
              class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 transition-all"
            >
              <Rocket class="w-4 h-4" />
              <span>Booster cette annonce (1.000 FCFA)</span>
            </button>
            <div v-else class="text-center text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 py-2 rounded-xl">
              ⭐ Annonce actuellement mise en avant !
            </div>

            <div class="flex items-center justify-between">
              <router-link 
                :to="`/annonces/${item.id}`" 
                class="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold"
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

    <!-- MODAL DE PAIEMENT & BOOST MOBILE MONEY (WAVE / ORANGE / MTN) -->
    <div v-if="showBoostModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-[#131d2e] border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
        <button 
          @click="showBoostModal = false" 
          class="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
        >
          <X class="w-5 h-5" />
        </button>

        <div v-if="!boostSuccess">
          <div class="text-center space-y-2 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <Rocket class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-white">Booster votre annonce</h3>
            <p class="text-xs text-slate-400">Placez votre annonce en tête d'affiche pendant 7 jours pour maximiser vos contacts.</p>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 mb-6">
            <div class="flex justify-between text-slate-300">
              <span>Annonce :</span>
              <strong class="text-white max-w-[200px] truncate">{{ selectedListingForBoost?.title }}</strong>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>Tarif du Boost (7 jours) :</span>
              <strong class="text-amber-400 text-sm">1.000 FCFA</strong>
            </div>
          </div>

          <!-- Étape 1 : Choisir le Mobile Money -->
          <div class="space-y-4 text-xs">
            <label class="block font-bold text-slate-200">Étape 1 : Choisissez le moyen de paiement</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                type="button" 
                @click="paymentMethod = 'WAVE'"
                :class="[
                  'py-2.5 px-3 rounded-xl border text-center font-bold transition-all',
                  paymentMethod === 'WAVE' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-800 bg-slate-900 text-slate-400'
                ]"
              >
                🌊 Wave
              </button>
              <button 
                type="button" 
                @click="paymentMethod = 'ORANGE'"
                :class="[
                  'py-2.5 px-3 rounded-xl border text-center font-bold transition-all',
                  paymentMethod === 'ORANGE' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-slate-800 bg-slate-900 text-slate-400'
                ]"
              >
                🍊 Orange Money
              </button>
              <button 
                type="button" 
                @click="paymentMethod = 'MTN'"
                :class="[
                  'py-2.5 px-3 rounded-xl border text-center font-bold transition-all',
                  paymentMethod === 'MTN' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' : 'border-slate-800 bg-slate-900 text-slate-400'
                ]"
              >
                🟡 MTN MoMo
              </button>
            </div>

            <!-- Étape 2 : Numéro de transfert -->
            <div class="p-4 bg-slate-900 border border-amber-500/30 rounded-2xl space-y-2">
              <span class="text-slate-400 block">Effectuez le transfert de **1.000 FCFA** au :</span>
              <div class="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                <span class="font-mono text-base font-extrabold text-amber-400">+225 07 00 00 00 01</span>
                <span class="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">Trouve Maison CI</span>
              </div>
            </div>

            <!-- Étape 3 : Saisir la preuve -->
            <div class="space-y-1.5">
              <label class="block font-bold text-slate-200">Étape 2 : Entrez votre numéro expéditeur ou ID de transaction *</label>
              <input 
                v-model="transactionId" 
                type="text" 
                placeholder="Ex: 0701020304 ou #WAVE-12345"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500"
              />
            </div>

            <button 
              @click="submitBoostRequest"
              class="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-98"
            >
              Envoyer ma demande de Boost
            </button>
          </div>
        </div>

        <!-- Succès Demande de Boost -->
        <div v-else class="text-center py-6 space-y-4">
          <CheckCircle2 class="w-16 h-16 text-emerald-400 mx-auto" />
          <h3 class="text-xl font-extrabold text-white">Demande de Boost transmise !</h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            Votre paiement de **1.000 FCFA** a été enregistré. Notre équipe vérifie la transaction et activera le badge **⭐ À la une** sur votre annonce sous quelques minutes.
          </p>
          <button 
            @click="showBoostModal = false" 
            class="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
