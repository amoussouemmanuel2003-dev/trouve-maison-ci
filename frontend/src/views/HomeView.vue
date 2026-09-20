<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useListingStore } from '../stores/listing.store';
import { useLocationStore } from '../stores/location.store';
import ListingCard from '../components/ListingCard.vue';
import RequestCard from '../components/RequestCard.vue';
import api from '../services/api';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  MessageSquare, 
  ChevronRight,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-vue-next';

const router = useRouter();
const listingStore = useListingStore();
const locationStore = useLocationStore();

// Filtres de la barre de recherche rapide
const selectedCommune = ref('');
const selectedType = ref('');
const maxPrice = ref('');

// Demandes "Je cherche" récentes
const recentRequests = ref([]);

onMounted(async () => {
  await locationStore.fetchCommunes();
  await listingStore.fetchListings({ limit: 6 });

  // Charger les dernières demandes locataires
  try {
    const res = await api.get('/requests?limit=3');
    recentRequests.value = res.data.data;
  } catch (err) {
    console.error('Erreur requêtes:', err);
  }
});

const handleSearch = () => {
  listingStore.filters.commune_id = selectedCommune.value;
  listingStore.filters.property_type = selectedType.value;
  listingStore.filters.max_price = maxPrice.value;
  router.push('/annonces');
};

const filterByCommune = (communeId) => {
  listingStore.filters.commune_id = communeId;
  router.push('/annonces');
};
</script>

<template>
  <div class="space-y-16 sm:space-y-24">
    <!-- 1. HERO SECTION -->
    <section class="relative pt-8 pb-16 overflow-hidden">
      <!-- Glows de fond -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <!-- Badge Côte d'Ivoire -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-amber-400 mb-6 shadow-sm">
          <span class="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Plateforme Immobilière d'Abidjan 🇨🇮</span>
        </div>

        <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight mb-6">
          Trouvez votre maison ou appartement à <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400">Abidjan sans stress</span>
        </h1>

        <p class="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Accédez aux logements vérifiés à Cocody, Yopougon, Marcory et partout à Abidjan. Transparence totale sur les cautions et compteurs CIE/SODECI.
        </p>

        <!-- BARRE DE RECHERCHE PRINCIPALE -->
        <div class="max-w-4xl mx-auto bg-[#131d2e]/90 backdrop-blur-xl border border-slate-700/80 p-3 sm:p-4 rounded-3xl shadow-2xl shadow-black/60">
          <form @submit.prevent="handleSearch" class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-left">
            <!-- Commune -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 ml-1">Commune</label>
              <div class="relative">
                <select 
                  v-model="selectedCommune" 
                  class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="">Toutes les communes</option>
                  <option v-for="c in locationStore.communes" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Type de bien -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 ml-1">Type de bien</label>
              <select 
                v-model="selectedType" 
                class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="">Tous les types</option>
                <option value="STUDIO">Studio</option>
                <option value="APARTMENT">Appartement (2-4 pièces)</option>
                <option value="VILLA">Villa / Duplex</option>
                <option value="ROOM">Chambre autonome</option>
                <option value="FLATSHARE">Colocation</option>
              </select>
            </div>

            <!-- Budget Max -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 ml-1">Budget Max (FCFA)</label>
              <input 
                v-model="maxPrice" 
                type="number" 
                placeholder="Ex: 250 000" 
                class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <!-- Bouton Rechercher -->
            <div class="sm:col-span-3 lg:col-span-1 flex items-end">
              <button 
                type="submit" 
                class="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-95"
              >
                <Search class="w-4 h-4" />
                <span>Rechercher</span>
              </button>
            </div>
          </form>

          <!-- Raccourcis communes populaires -->
          <div class="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 overflow-x-auto pb-1">
            <span class="font-medium text-slate-500 whitespace-nowrap">Populaires :</span>
            <button @click="filterByCommune(1)" class="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white whitespace-nowrap transition-colors">Cocody</button>
            <button @click="filterByCommune(2)" class="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white whitespace-nowrap transition-colors">Yopougon</button>
            <button @click="filterByCommune(3)" class="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white whitespace-nowrap transition-colors">Marcory</button>
            <button @click="filterByCommune(11)" class="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white whitespace-nowrap transition-colors">Bingerville</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. NOS ATOUTS / TRANSPARENCE CIV -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-[#131d2e] border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
          <div class="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white mb-1">Clarté sur les cautions</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Détail transparent : Cautions, avances et honoraires clairement séparés selon la réglementation ivoirienne.
            </p>
          </div>
        </div>

        <div class="bg-[#131d2e] border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
          <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white mb-1">Compteurs CIE & SODECI</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Vérifiez à l'avance si le logement dispose d'une carte prépayée, d'un sous-compteur ou d'un forfait partagé.
            </p>
          </div>
        </div>

        <div class="bg-[#131d2e] border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
          <div class="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MessageSquare class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white mb-1">WhatsApp direct</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Contactez instantanément le bailleur ou démarcheur avec un message pré-rempli pour organiser une visite.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. DERNIÈRES ANNONCES EN VEDETTE -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <div class="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <TrendingUp class="w-4 h-4" />
            <span>Offres disponibles</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Annonces récentes à Abidjan</h2>
        </div>

        <router-link 
          to="/annonces" 
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          <span>Voir tout</span>
          <ChevronRight class="w-4 h-4" />
        </router-link>
      </div>

      <!-- Grille des annonces -->
      <div v-if="listingStore.isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="n in 6" :key="n" class="bg-[#131d2e] rounded-2xl h-80 animate-pulse border border-slate-800"></div>
      </div>

      <div v-else-if="listingStore.listings.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ListingCard 
          v-for="item in listingStore.listings" 
          :key="item.id" 
          :listing="item"
          @toggle-favorite="listingStore.toggleFavorite(item.id)"
        />
      </div>

      <div v-else class="text-center py-12 bg-[#131d2e] rounded-2xl border border-slate-800">
        <p class="text-slate-400">Aucune annonce disponible pour le moment.</p>
      </div>
    </section>

    <!-- 4. SECTION "JE CHERCHE" (COMMUNAUTÉ DE LOCATAIRES) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div class="bg-gradient-to-br from-[#131d2e] to-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-10">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              Locataires en attente
            </span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white">
              Demandes récentes ("Je cherche")
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">
              Vous êtes bailleur ou démarcheur ? Répondez directement aux locataires qui expriment leurs besoins.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <router-link 
              to="/je-cherche" 
              class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-colors shadow-lg shadow-emerald-950/20"
            >
              Publier mon besoin
            </router-link>
            <router-link 
              to="/je-cherche" 
              class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
            >
              Voir toutes les demandes
            </router-link>
          </div>
        </div>

        <!-- Grille des demandes -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <RequestCard 
            v-for="req in recentRequests" 
            :key="req.id" 
            :request="req" 
          />
        </div>
      </div>
    </section>
  </div>
</template>
