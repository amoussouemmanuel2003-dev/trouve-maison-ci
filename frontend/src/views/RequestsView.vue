<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { useLocationStore } from '../stores/location.store';
import RequestCard from '../components/RequestCard.vue';
import api from '../services/api';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Filter, 
  X, 
  Sparkles,
  AlertCircle
} from 'lucide-vue-next';

const authStore = useAuthStore();
const locationStore = useLocationStore();

const requests = ref([]);
const isLoading = ref(false);
const isModalOpen = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Filtres
const selectedCommune = ref('');
const maxBudgetFilter = ref('');

// Formulaire nouvelle demande
const form = ref({
  title: '',
  description: '',
  property_type: 'APARTMENT',
  commune_id: '',
  neighborhood_name: '',
  min_budget: '',
  max_budget: '',
  bedrooms_min: 1,
  is_furnished: false,
  urgency_level: 'NORMAL',
  contact_phone: authStore.user?.phone || '',
  contact_whatsapp: authStore.user?.whatsapp_number || authStore.user?.phone || '',
});

const fetchRequests = async () => {
  isLoading.value = true;
  try {
    const params = {};
    if (selectedCommune.value) params.commune_id = selectedCommune.value;
    if (maxBudgetFilter.value) params.max_budget = maxBudgetFilter.value;

    const res = await api.get('/requests', { params });
    requests.value = res.data.data;
  } catch (err) {
    console.error('Erreur chargement demandes:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await locationStore.fetchCommunes();
  await fetchRequests();
});

const submitRequest = async () => {
  if (!authStore.isAuthenticated) {
    alert('Veuillez vous connecter pour publier votre recherche de logement.');
    return;
  }

  errorMessage.value = '';
  successMessage.value = '';

  try {
    const res = await api.post('/requests', form.value);
    successMessage.value = 'Votre recherche a été publiée avec succès !';
    setTimeout(() => {
      isModalOpen.value = false;
      successMessage.value = '';
      fetchRequests();
    }, 1200);
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Erreur lors de la publication.';
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
          <Sparkles class="w-4 h-4" />
          <span>Espace Locataires</span>
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">
          Demandes "Je cherche" à Abidjan
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Les locataires expriment directement leur besoin et budget. Propriétaires et démarcheurs, proposez vos biens disponibles !
        </p>
      </div>

      <button 
        @click="isModalOpen = true"
        class="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 active:scale-95 transition-all"
      >
        <PlusCircle class="w-4 h-4" />
        <span>Publier mon besoin</span>
      </button>
    </div>

    <!-- Filtres rapides -->
    <div class="bg-[#131d2e] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-[200px]">
        <select 
          v-model="selectedCommune" 
          @change="fetchRequests"
          class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">Toutes les communes</option>
          <option v-for="c in locationStore.communes" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div class="flex-1 min-w-[200px]">
        <input 
          v-model="maxBudgetFilter" 
          @keyup.enter="fetchRequests"
          type="number" 
          placeholder="Budget max (FCFA)..." 
          class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      <button 
        @click="fetchRequests" 
        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
      >
        Filtrer
      </button>
    </div>

    <!-- Liste des demandes -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="h-64 rounded-2xl bg-[#131d2e] animate-pulse border border-slate-800"></div>
    </div>

    <div v-else-if="requests.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RequestCard 
        v-for="req in requests" 
        :key="req.id" 
        :request="req" 
      />
    </div>

    <div v-else class="text-center py-16 bg-[#131d2e] border border-slate-800 rounded-2xl">
      <p class="text-slate-400 text-sm">Aucune demande trouvée pour ces critères.</p>
    </div>

    <!-- MODAL DE PUBLICATION D'UNE DEMANDE -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="bg-[#131d2e] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <FileText class="w-5 h-5 text-emerald-400" />
            <span>Publier ma recherche de logement</span>
          </h3>
          <button @click="isModalOpen = false" class="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <div v-if="successMessage" class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
          {{ successMessage }}
        </div>

        <form @submit.prevent="submitRequest" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Titre de votre recherche *</label>
            <input 
              v-model="form.title" 
              required
              type="text" 
              placeholder="Ex: Cherche 2 pièces propre à Angré 8e" 
              class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Type de bien *</label>
              <select v-model="form.property_type" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white">
                <option value="STUDIO">Studio</option>
                <option value="APARTMENT">Appartement</option>
                <option value="VILLA">Villa</option>
                <option value="ROOM">Chambre</option>
                <option value="FLATSHARE">Colocation</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Commune souhaitée</label>
              <select v-model="form.commune_id" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white">
                <option value="">Indifférent</option>
                <option v-for="c in locationStore.communes" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Budget max (FCFA) *</label>
              <input 
                v-model="form.max_budget" 
                required
                type="number" 
                placeholder="Ex: 150000" 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Degré d'urgence</label>
              <select v-model="form.urgency_level" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white">
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Très urgent</option>
                <option value="FLEXIBLE">Flexible</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Précisions (quartier précis, date d'entrée, etc.)</label>
            <textarea 
              v-model="form.description" 
              rows="3" 
              placeholder="Ex: Proche transport, compteur CIE à carte obligatoire..." 
              class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Numéro d'appel *</label>
              <input 
                v-model="form.contact_phone" 
                required
                type="tel" 
                placeholder="+22507..." 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">WhatsApp</label>
              <input 
                v-model="form.contact_whatsapp" 
                type="tel" 
                placeholder="+22507..." 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-colors mt-2"
          >
            Publier ma recherche
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
