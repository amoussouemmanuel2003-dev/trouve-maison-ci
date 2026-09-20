<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useLocationStore } from '../stores/location.store';
import { useListingStore } from '../stores/listing.store';
import { 
  Building, 
  MapPin, 
  DollarSign, 
  Zap, 
  Image as ImageIcon, 
  Check, 
  AlertCircle 
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const locationStore = useLocationStore();
const listingStore = useListingStore();

const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const form = ref({
  title: '',
  description: '',
  property_type: 'APARTMENT',
  city_id: 1,
  commune_id: '',
  neighborhood_id: '',
  address_details: '',
  monthly_rent: '',
  charges_included: false,
  charges_amount: 0,
  deposit_months: 2,
  advance_months: 2,
  agency_fee_months: 1,
  bedrooms: 2,
  bathrooms: 1,
  surface_area: '',
  is_furnished: false,
  has_balcony: true,
  has_parking: false,
  has_security: true,
  has_air_conditioning: false,
  water_meter_type: 'INDIVIDUAL',
  electricity_meter_type: 'INDIVIDUAL',
  whatsapp_contact: authStore.user?.whatsapp_number || authStore.user?.phone || '',
  call_contact: authStore.user?.phone || '',
  imageUrl1: '',
  imageUrl2: '',
});

const neighborhoods = ref([]);

onMounted(async () => {
  await locationStore.fetchCommunes();
});

const onCommuneChange = async () => {
  if (form.value.commune_id) {
    neighborhoods.value = await locationStore.fetchNeighborhoods(form.value.commune_id);
    form.value.neighborhood_id = '';
  } else {
    neighborhoods.value = [];
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isSubmitting.value = true;

  const images = [];
  if (form.value.imageUrl1) images.push(form.value.imageUrl1.trim());
  if (form.value.imageUrl2) images.push(form.value.imageUrl2.trim());

  const payload = {
    ...form.value,
    images: images.length > 0 ? images : [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
    ]
  };

  const res = await listingStore.createListing(payload);
  isSubmitting.value = false;

  if (res.success) {
    successMessage.value = res.message;
    setTimeout(() => {
      router.push('/mon-espace');
    }, 1500);
  } else {
    errorMessage.value = res.message;
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-white tracking-tight">
        Publier une annonce immobilière
      </h1>
      <p class="text-sm text-slate-400 mt-1">
        Renseignez les caractéristiques du logement pour une mise en relation rapide avec les locataires d'Abidjan.
      </p>
    </div>

    <div v-if="errorMessage" class="p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm text-red-400 flex items-center gap-2">
      <AlertCircle class="w-5 h-5 flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <div v-if="successMessage" class="p-4 mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-sm text-emerald-400 flex items-center gap-2">
      <Check class="w-5 h-5 flex-shrink-0" />
      <span>{{ successMessage }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-8 text-sm">
      <!-- 1. GÉNÉRALITÉS -->
      <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Building class="w-5 h-5 text-amber-500" />
          <span>Informations générales</span>
        </h3>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Titre de l'annonce *</label>
          <input 
            v-model="form.title" 
            required
            type="text" 
            placeholder="Ex: Bel appartement 3 pièces staffé à Angré 8e tranche"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Type de logement *</label>
            <select v-model="form.property_type" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
              <option value="APARTMENT">Appartement</option>
              <option value="STUDIO">Studio</option>
              <option value="VILLA">Villa / Duplex</option>
              <option value="HOUSE">Maison basse</option>
              <option value="ROOM">Chambre autonome</option>
              <option value="FLATSHARE">Colocation</option>
            </select>
          </div>

          <div class="flex items-center gap-3 pt-6">
            <input 
              id="furnished"
              v-model="form.is_furnished" 
              type="checkbox" 
              class="w-5 h-5 rounded text-amber-500 bg-slate-900 border-slate-700"
            />
            <label for="furnished" class="text-slate-300 font-semibold cursor-pointer">
              Logement meublé
            </label>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Description détaillée *</label>
          <textarea 
            v-model="form.description" 
            required
            rows="4" 
            placeholder="Décrivez l'état du bien, l'accès bitumé, le niveau de sécurité, etc."
            class="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:border-amber-500"
          ></textarea>
        </div>
      </div>

      <!-- 2. LOCALISATION -->
      <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <MapPin class="w-5 h-5 text-amber-500" />
          <span>Localisation à Abidjan</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Commune d'Abidjan *</label>
            <select 
              v-model="form.commune_id" 
              @change="onCommuneChange" 
              required
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Sélectionnez une commune</option>
              <option v-for="c in locationStore.communes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Quartier spécifique</label>
            <select v-model="form.neighborhood_id" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
              <option value="">Sélectionnez un quartier</option>
              <option v-for="n in neighborhoods" :key="n.id" :value="n.id">{{ n.name }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Repères et accès précis</label>
          <input 
            v-model="form.address_details" 
            type="text" 
            placeholder="Ex: Proche Pharmacie des Oliviers, Carrefour Duncan"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
          />
        </div>
      </div>

      <!-- 3. FINANCIER & CAUTIONS (FCFA) -->
      <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <DollarSign class="w-5 h-5 text-amber-500" />
          <span>Loyer et Cautions (FCFA)</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Loyer mensuel (FCFA) *</label>
            <input 
              v-model="form.monthly_rent" 
              required
              type="number" 
              placeholder="Ex: 250000"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold"
            />
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Caution</label>
              <select v-model="form.deposit_months" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white">
                <option :value="1">1 mois</option>
                <option :value="2">2 mois</option>
                <option :value="3">3 mois</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Avance</label>
              <select v-model="form.advance_months" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white">
                <option :value="1">1 mois</option>
                <option :value="2">2 mois</option>
                <option :value="3">3 mois</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1.5">Agence</label>
              <select v-model="form.agency_fee_months" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white">
                <option :value="0">0 mois</option>
                <option :value="1">1 mois</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. COMPTEURS CIE & SODECI -->
      <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Zap class="w-5 h-5 text-amber-500" />
          <span>Compteurs CIE & SODECI (Côte d'Ivoire)</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Électricité (CIE) *</label>
            <select v-model="form.electricity_meter_type" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
              <option value="INDIVIDUAL">Compteur Individuel / Carte Prépayée</option>
              <option value="SUB_METER">Sous-compteur (Décompteur)</option>
              <option value="SHARED">Forfait partagé</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Eau (SODECI) *</label>
            <select v-model="form.water_meter_type" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
              <option value="INDIVIDUAL">Compteur Individuel SODECI</option>
              <option value="SUB_METER">Sous-compteur SODECI</option>
              <option value="SHARED">Forfait partagé</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 5. PIÈCES & ÉQUIPEMENTS -->
      <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 class="text-base font-bold text-white">Caractéristiques & Commodités</h3>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Chambres</label>
            <input v-model="form.bedrooms" type="number" min="0" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Salles d'eau</label>
            <input v-model="form.bathrooms" type="number" min="1" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Surface (m²)</label>
            <input v-model="form.surface_area" type="number" placeholder="Ex: 85" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" />
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.has_security" type="checkbox" class="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700" />
            <span class="text-xs text-slate-300">Gardien / Vigile</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.has_parking" type="checkbox" class="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700" />
            <span class="text-xs text-slate-300">Parking / Garage</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.has_balcony" type="checkbox" class="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700" />
            <span class="text-xs text-slate-300">Balcon</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.has_air_conditioning" type="checkbox" class="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700" />
            <span class="text-xs text-slate-300">Climatisation</span>
          </label>
        </div>
      </div>

      <!-- 6. PHOTOS -->
      <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <ImageIcon class="w-5 h-5 text-amber-500" />
          <span>Photos du bien (URLs)</span>
        </h3>

        <div class="space-y-3">
          <input 
            v-model="form.imageUrl1" 
            type="url" 
            placeholder="URL Photo Principale (https://...)" 
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
          />
          <input 
            v-model="form.imageUrl2" 
            type="url" 
            placeholder="URL Photo 2 (optionnel)" 
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
          />
        </div>
      </div>

      <!-- 7. CONTACTS -->
      <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 class="text-base font-bold text-white">Contacts pour les visites</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Numéro WhatsApp *</label>
            <input v-model="form.whatsapp_contact" required type="tel" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Numéro d'appel direct</label>
            <input v-model="form.call_contact" type="tel" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
          </div>
        </div>
      </div>

      <!-- Bouton Soumettre -->
      <button 
        type="submit" 
        :disabled="isSubmitting"
        class="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-base shadow-xl shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50"
      >
        <span v-if="isSubmitting">Publication en cours...</span>
        <span v-else>Valider et publier mon annonce</span>
      </button>
    </form>
  </div>
</template>
