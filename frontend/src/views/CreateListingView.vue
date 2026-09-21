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
  AlertCircle,
  Camera,
  UploadCloud,
  X,
  Shield
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const locationStore = useLocationStore();
const listingStore = useListingStore();

const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const galleryInput = ref(null);
const cameraInput = ref(null);
const uploadedImages = ref([]); // Array of base64 data strings

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

const triggerGallery = () => {
  if (galleryInput.value) galleryInput.value.click();
};

const triggerCamera = () => {
  if (cameraInput.value) cameraInput.value.click();
};

// Fonction de compression des images pour optimiser la taille en base64
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const compressedData = await compressImage(file);
      uploadedImages.value.push(compressedData);
    } catch (err) {
      console.error('Erreur lecture image:', err);
    }
  }

  // Réinitialiser le champ file pour ré-autoriser la même sélection
  event.target.value = '';
};

const removeImage = (index) => {
  uploadedImages.value.splice(index, 1);
};

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (uploadedImages.value.length === 0) {
    errorMessage.value = 'Veuillez ajouter au moins une photo de votre logement (depuis votre galerie ou appareil photo).';
    return;
  }

  isSubmitting.value = true;

  const payload = {
    ...form.value,
    images: uploadedImages.value
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

    <!-- Si c'est un Super Admin, afficher un message explicatif -->
    <div v-if="authStore.isAdmin" class="bg-[#131d2e] border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 mb-8 shadow-xl">
      <div class="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
        <Shield class="w-8 h-8" />
      </div>
      <h2 class="text-xl font-bold text-white">Espace Super Administrateur</h2>
      <p class="text-sm text-slate-300 max-w-lg mx-auto">
        En tant que Super Administrateur, vous n'avez pas besoin de publier d'annonces. Votre rôle est de **modérer, approuver ou supprimer** les annonces publiées par les propriétaires, démarcheurs et clients.
      </p>
      <router-link 
        to="/admin" 
        class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700 transition-all"
      >
        <Shield class="w-4 h-4" />
        <span>Accéder au Panneau Administrateur</span>
      </router-link>
    </div>

    <template v-else>
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

        <!-- 6. PHOTOS DU BIEN (TÉLÉPHONE OU GALERIE) -->
        <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <ImageIcon class="w-5 h-5 text-amber-500" />
              <span>Photos du bien (Galerie ou Appareil Photo) *</span>
            </h3>
            <span class="text-xs text-slate-400 font-medium">{{ uploadedImages.length }} photo(s) sélectionnée(s)</span>
          </div>

          <!-- Inputs cachés pour Galerie et Caméra -->
          <input 
            type="file" 
            ref="galleryInput" 
            accept="image/*" 
            multiple 
            @change="handleFileSelect" 
            class="hidden" 
          />
          <input 
            type="file" 
            ref="cameraInput" 
            accept="image/*" 
            capture="environment" 
            @change="handleFileSelect" 
            class="hidden" 
          />

          <!-- Boutons de sélection d'images -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              type="button" 
              @click="triggerCamera" 
              class="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold transition-all active:scale-98"
            >
              <Camera class="w-5 h-5" />
              <span>Prendre une photo (Appareil photo)</span>
            </button>

            <button 
              type="button" 
              @click="triggerGallery" 
              class="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 font-bold transition-all active:scale-98"
            >
              <UploadCloud class="w-5 h-5 text-emerald-400" />
              <span>Choisir dans la galerie</span>
            </button>
          </div>

          <!-- Aperçu des photos sélectionnées -->
          <div v-if="uploadedImages.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div 
              v-for="(img, idx) in uploadedImages" 
              :key="idx" 
              class="relative group aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-slate-900"
            >
              <img :src="img" alt="Aperçu photo" class="w-full h-full object-cover" />
              <div class="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] text-amber-400 font-bold border border-slate-700">
                {{ idx === 0 ? 'Principale' : `Photo ${idx + 1}` }}
              </div>
              <button 
                type="button" 
                @click="removeImage(idx)" 
                class="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                title="Supprimer la photo"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-else class="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            Aucune photo sélectionnée pour le moment. Appuyez sur un des boutons ci-dessus pour ajouter des photos.
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
    </template>
  </div>
</template>
