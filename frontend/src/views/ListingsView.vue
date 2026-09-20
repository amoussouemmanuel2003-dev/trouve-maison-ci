<script setup>
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useListingStore } from '../stores/listing.store';
import { useLocationStore } from '../stores/location.store';
import ListingCard from '../components/ListingCard.vue';
import { 
  Filter, 
  RotateCcw, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  SlidersHorizontal 
} from 'lucide-vue-next';

const route = useRoute();
const listingStore = useListingStore();
const locationStore = useLocationStore();

onMounted(async () => {
  await locationStore.fetchCommunes();

  // Si des paramètres sont dans l'URL (ex: depuis l'accueil)
  if (route.query.commune_id) {
    listingStore.filters.commune_id = route.query.commune_id;
  }
  if (route.query.property_type) {
    listingStore.filters.property_type = route.query.property_type;
  }

  await listingStore.fetchListings();
});

const applyFilters = () => {
  listingStore.pagination.page = 1;
  listingStore.fetchListings();
};

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= listingStore.pagination.totalPages) {
    listingStore.pagination.page = newPage;
    listingStore.fetchListings({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- En-tête de page -->
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-white tracking-tight mb-2">
        Annonces Immobilières à Abidjan
      </h1>
      <p class="text-sm text-slate-400">
        {{ listingStore.pagination.total }} logements répertoriés selon vos critères.
      </p>
    </div>

    <!-- Disposition Grille : Barre de filtres + Liste -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- 1. VOLET DE FILTRES (Desktop Sidebar / Mobile Top) -->
      <aside class="lg:col-span-1">
        <div class="bg-[#131d2e] border border-slate-800 rounded-2xl p-5 sticky top-24 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2 text-sm font-bold text-white">
              <SlidersHorizontal class="w-4 h-4 text-amber-500" />
              <span>Filtres de recherche</span>
            </div>
            <button 
              @click="listingStore.resetFilters()" 
              class="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <RotateCcw class="w-3 h-3" />
              <span>Effacer</span>
            </button>
          </div>

          <!-- Recherche par mot-clé -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">Mots-clés / Repère</label>
            <div class="relative">
              <input 
                v-model="listingStore.filters.search" 
                @keyup.enter="applyFilters"
                type="text" 
                placeholder="Ex: Angré 8e, piscine..." 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <!-- Commune -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">Commune</label>
            <select 
              v-model="listingStore.filters.commune_id" 
              @change="applyFilters"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Toutes les communes</option>
              <option v-for="c in locationStore.communes" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <!-- Type de bien -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">Type de bien</label>
            <select 
              v-model="listingStore.filters.property_type" 
              @change="applyFilters"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Tous les types</option>
              <option value="STUDIO">Studio</option>
              <option value="APARTMENT">Appartement</option>
              <option value="VILLA">Villa / Duplex</option>
              <option value="ROOM">Chambre autonome</option>
              <option value="FLATSHARE">Colocation</option>
            </select>
          </div>

          <!-- Budget Min & Max (FCFA) -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5">Min (FCFA)</label>
              <input 
                v-model="listingStore.filters.min_price" 
                @keyup.enter="applyFilters"
                type="number" 
                placeholder="50 000" 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5">Max (FCFA)</label>
              <input 
                v-model="listingStore.filters.max_price" 
                @keyup.enter="applyFilters"
                type="number" 
                placeholder="500 000" 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <!-- Nombre de chambres -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">Chambres min.</label>
            <select 
              v-model="listingStore.filters.bedrooms" 
              @change="applyFilters"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Indifférent</option>
              <option value="1">1 chambre et plus</option>
              <option value="2">2 chambres et plus</option>
              <option value="3">3 chambres et plus</option>
              <option value="4">4 chambres et plus</option>
            </select>
          </div>

          <!-- Meublé -->
          <div class="flex items-center gap-2 pt-1">
            <input 
              id="is_furnished_filter"
              v-model="listingStore.filters.is_furnished" 
              @change="applyFilters"
              type="checkbox" 
              class="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0"
            />
            <label for="is_furnished_filter" class="text-xs text-slate-300 select-none cursor-pointer">
              Logement meublé uniquement
            </label>
          </div>

          <!-- Bouton Appliquer -->
          <button 
            @click="applyFilters" 
            class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-colors"
          >
            Appliquer les filtres
          </button>
        </div>
      </aside>

      <!-- 2. LISTE DES LOGEMENTS -->
      <main class="lg:col-span-3 space-y-6">
        <!-- Barre supérieure de tri -->
        <div class="bg-[#131d2e] border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between text-xs">
          <span class="text-slate-400">
            Affichage de <strong>{{ listingStore.listings.length }}</strong> sur <strong>{{ listingStore.pagination.total }}</strong>
          </span>

          <div class="flex items-center gap-2">
            <span class="text-slate-400 hidden sm:inline">Trier par :</span>
            <select 
              v-model="listingStore.filters.sort" 
              @change="applyFilters"
              class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="recent">Plus récentes d'abord</option>
              <option value="price_asc">Loyer croissant</option>
              <option value="price_desc">Loyer décroissant</option>
              <option value="views">Les plus consultées</option>
            </select>
          </div>
        </div>

        <!-- Chargement / Skeleton -->
        <div v-if="listingStore.isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="bg-[#131d2e] rounded-2xl h-80 animate-pulse border border-slate-800"></div>
        </div>

        <!-- Grille de résultats -->
        <div v-else-if="listingStore.listings.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ListingCard 
            v-for="item in listingStore.listings" 
            :key="item.id" 
            :listing="item"
            @toggle-favorite="listingStore.toggleFavorite(item.id)"
          />
        </div>

        <!-- Aucun résultat -->
        <div v-else class="text-center py-16 bg-[#131d2e] border border-slate-800 rounded-2xl">
          <p class="text-base font-semibold text-slate-300 mb-2">Aucun logement trouvé</p>
          <p class="text-xs text-slate-500 mb-6">Essayez d'élargir vos filtres de commune ou de budget.</p>
          <button 
            @click="listingStore.resetFilters()" 
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            Réinitialiser les filtres
          </button>
        </div>

        <!-- Pagination -->
        <div v-if="listingStore.pagination.totalPages > 1" class="flex items-center justify-center gap-2 pt-6">
          <button 
            @click="changePage(listingStore.pagination.page - 1)"
            :disabled="listingStore.pagination.page === 1"
            class="p-2 rounded-xl bg-[#131d2e] border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <span class="text-xs text-slate-400 px-3">
            Page {{ listingStore.pagination.page }} sur {{ listingStore.pagination.totalPages }}
          </span>

          <button 
            @click="changePage(listingStore.pagination.page + 1)"
            :disabled="listingStore.pagination.page === listingStore.pagination.totalPages"
            class="p-2 rounded-xl bg-[#131d2e] border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  </div>
</template>
