<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useListingStore } from '../stores/listing.store';
import WhatsAppButton from '../components/WhatsAppButton.vue';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  Zap, 
  Droplet, 
  Shield, 
  Phone, 
  Share2, 
  Heart,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Building
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const listingStore = useListingStore();

const activeImageIndex = ref(0);
const isFavorite = ref(false);

onMounted(async () => {
  const listingId = route.params.id;
  await listingStore.fetchListingById(listingId);
});

const listing = computed(() => listingStore.currentListing);

// Formatage FCFA
const formatMoney = (val) => {
  return new Intl.NumberFormat('fr-FR').format(Number(val) || 0) + ' FCFA';
};

// Calcul du montant total requis à l'entrée (Caution + Avance + Frais)
const totalEntryCost = computed(() => {
  if (!listing.value) return 0;
  const rent = Number(listing.value.monthly_rent) || 0;
  const deposit = (listing.value.deposit_months || 0) * rent;
  const advance = (listing.value.advance_months || 0) * rent;
  const agency = (listing.value.agency_fee_months || 0) * rent;
  return rent + deposit + advance + agency; // Total estimé débours initial
});

const toggleFavorite = async () => {
  if (listing.value) {
    const res = await listingStore.toggleFavorite(listing.value.id);
    if (res.success) {
      isFavorite.value = res.isFavorite;
    }
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Bouton retour -->
    <button 
      @click="router.back()" 
      class="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
    >
      <ChevronLeft class="w-4 h-4" />
      <span>Retour aux annonces</span>
    </button>

    <!-- Chargement -->
    <div v-if="listingStore.isLoading" class="h-96 rounded-3xl bg-[#131d2e] animate-pulse"></div>

    <!-- Contenu de l'annonce -->
    <div v-else-if="listing" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- COLONNE GAUCHE (2 tiers) : Galerie, Caractéristiques & Description -->
      <div class="lg:col-span-2 space-y-8">
        <!-- 1. GALERIE PHOTOS -->
        <div class="space-y-3">
          <div class="aspect-[16/10] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative shadow-2xl">
            <img 
              v-if="listing.images && listing.images.length > 0"
              :src="listing.images[activeImageIndex]?.image_url" 
              :alt="listing.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-600">
              <Building class="w-16 h-16" />
            </div>

            <!-- Badges sur l'image -->
            <div class="absolute top-4 left-4 flex gap-2">
              <span class="px-3 py-1 rounded-xl text-xs font-bold bg-black/70 backdrop-blur-md text-amber-400 border border-amber-400/30">
                {{ listing.property_type }}
              </span>
              <span v-if="listing.is_furnished" class="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md">
                Meublé
              </span>
            </div>
          </div>

          <!-- Miniatures -->
          <div v-if="listing.images && listing.images.length > 1" class="flex gap-3 overflow-x-auto pb-2">
            <button 
              v-for="(img, idx) in listing.images" 
              :key="idx"
              @click="activeImageIndex = idx"
              :class="[
                'w-20 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all',
                activeImageIndex === idx ? 'border-amber-500 scale-95 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
              ]"
            >
              <img :src="img.image_url" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- 2. TITRE & LOCALISATION -->
        <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div class="flex items-center gap-2 text-sm font-semibold text-amber-400">
            <MapPin class="w-4 h-4" />
            <span>{{ listing.commune_name }}</span>
            <span v-if="listing.neighborhood_name">• {{ listing.neighborhood_name }}</span>
            <span v-if="listing.city_name">({{ listing.city_name }})</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {{ listing.title }}
          </h1>

          <p v-if="listing.address_details" class="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            📍 <strong>Repère / Précision :</strong> {{ listing.address_details }}
          </p>

          <!-- Métriques Clés (Chambres, Salles de bain, Surface) -->
          <div class="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-center">
            <div class="p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
              <Bed class="w-5 h-5 mx-auto text-amber-400 mb-1" />
              <span class="text-xs text-slate-400 block">Chambres</span>
              <span class="text-base font-bold text-white">{{ listing.bedrooms || 1 }}</span>
            </div>
            <div class="p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
              <Bath class="w-5 h-5 mx-auto text-cyan-400 mb-1" />
              <span class="text-xs text-slate-400 block">Salles d'eau</span>
              <span class="text-base font-bold text-white">{{ listing.bathrooms || 1 }}</span>
            </div>
            <div class="p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
              <Maximize2 class="w-5 h-5 mx-auto text-emerald-400 mb-1" />
              <span class="text-xs text-slate-400 block">Superficie</span>
              <span class="text-base font-bold text-white">{{ listing.surface_area ? listing.surface_area + ' m²' : 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- 3. COMPTEURS ÉLECTRICITÉ & EAU (CIE / SODECI) -->
        <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-amber-400" />
            <span>Raccordements Énergie & Eau (CIE / SODECI)</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- CIE -->
            <div class="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
              <div class="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400">
                <Zap class="w-5 h-5" />
              </div>
              <div>
                <span class="text-xs text-slate-400 block">Compteur Électricité CIE</span>
                <span class="text-sm font-bold text-white">
                  {{ listing.electricity_meter_type === 'INDIVIDUAL' ? 'Compteur Individuel / Carte' : listing.electricity_meter_type === 'SUB_METER' ? 'Sous-compteur (Décompteur)' : 'Forfait partagé' }}
                </span>
                <p class="text-[11px] text-slate-500 mt-0.5">Facturation directe selon consommation.</p>
              </div>
            </div>

            <!-- SODECI -->
            <div class="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
              <div class="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Droplet class="w-5 h-5" />
              </div>
              <div>
                <span class="text-xs text-slate-400 block">Alimentation Eau SODECI</span>
                <span class="text-sm font-bold text-white">
                  {{ listing.water_meter_type === 'INDIVIDUAL' ? 'Compteur Individuel SODECI' : listing.water_meter_type === 'SUB_METER' ? 'Sous-compteur d\'eau' : 'Forfait fixe partagé' }}
                </span>
                <p class="text-[11px] text-slate-500 mt-0.5">Eau courante disponible dans l'immeuble.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. DESCRIPTION COMPLÈTE -->
        <div class="bg-[#131d2e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 class="text-lg font-bold text-white">Description du logement</h3>
          <p class="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {{ listing.description }}
          </p>

          <!-- Équipements -->
          <div class="pt-6 border-t border-slate-800">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Équipements inclus</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div class="flex items-center gap-2" :class="listing.has_security ? 'text-emerald-400' : 'text-slate-600 line-through'">
                <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
                <span>Gardiennage / Vigile</span>
              </div>
              <div class="flex items-center gap-2" :class="listing.has_parking ? 'text-emerald-400' : 'text-slate-600 line-through'">
                <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
                <span>Parking / Garage</span>
              </div>
              <div class="flex items-center gap-2" :class="listing.has_balcony ? 'text-emerald-400' : 'text-slate-600 line-through'">
                <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
                <span>Balcon</span>
              </div>
              <div class="flex items-center gap-2" :class="listing.has_air_conditioning ? 'text-emerald-400' : 'text-slate-600 line-through'">
                <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
                <span>Climatisation</span>
              </div>
              <div class="flex items-center gap-2" :class="listing.has_pool ? 'text-emerald-400' : 'text-slate-600 line-through'">
                <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
                <span>Piscine</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLONNE DROITE (1 tiers) : PRIX, CONDITIONS FINANCIERES & CONTACT -->
      <div class="space-y-6">
        <!-- Boîte de Réservation & Prix -->
        <div class="bg-[#131d2e] border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl sticky top-24">
          <div>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Loyer mensuel</span>
            <div class="text-3xl font-extrabold text-white tracking-tight">
              {{ formatMoney(listing.monthly_rent) }}
            </div>
            <span v-if="listing.charges_included" class="text-xs font-medium text-emerald-400">
              Charges comprises
            </span>
            <span v-else-if="listing.charges_amount > 0" class="text-xs text-slate-400">
              + {{ formatMoney(listing.charges_amount) }} de charges communes
            </span>
          </div>

          <!-- DÉCOMPOSITION FINANCIÈRE CIV (Cautions & Avances) -->
          <div class="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs">
            <span class="font-bold text-slate-200 block mb-2">Modalités à la signature :</span>
            
            <div class="flex justify-between text-slate-400">
              <span>Caution ({{ listing.deposit_months || 2 }} mois) :</span>
              <strong class="text-slate-200">{{ formatMoney((listing.deposit_months || 2) * listing.monthly_rent) }}</strong>
            </div>

            <div class="flex justify-between text-slate-400">
              <span>Avance de loyer ({{ listing.advance_months || 2 }} mois) :</span>
              <strong class="text-slate-200">{{ formatMoney((listing.advance_months || 2) * listing.monthly_rent) }}</strong>
            </div>

            <div class="flex justify-between text-slate-400">
              <span>Frais d'agence / Démarcheur ({{ listing.agency_fee_months || 1 }} mois) :</span>
              <strong class="text-slate-200">{{ formatMoney((listing.agency_fee_months || 1) * listing.monthly_rent) }}</strong>
            </div>

            <div class="border-t border-slate-700 pt-2 flex justify-between text-sm font-extrabold text-amber-400">
              <span>Total estimé à débourser :</span>
              <span>{{ formatMoney(totalEntryCost) }}</span>
            </div>
          </div>

          <!-- Actions de Contact -->
          <div class="space-y-3">
            <WhatsAppButton 
              :phone="listing.whatsapp_contact || listing.author_whatsapp || '+2250700000000'"
              :listing-title="listing.title"
              :listing-id="listing.id"
              label="Contacter sur WhatsApp"
              size="lg"
              :full-width="true"
            />

            <a 
              :href="'tel:' + (listing.call_contact || listing.author_phone)"
              class="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-sm font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Phone class="w-4 h-4 text-amber-400" />
              <span>Appeler directement</span>
            </a>
          </div>

          <!-- Profil du Déposant -->
          <div class="pt-4 border-t border-slate-800 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30">
              {{ listing.author_name?.charAt(0) || 'A' }}
            </div>
            <div>
              <span class="text-xs text-slate-400 block">Publié par</span>
              <span class="text-sm font-bold text-white">{{ listing.author_name }}</span>
              <span class="text-[10px] uppercase font-bold text-amber-400 block">
                {{ listing.author_role === 'LANDLORD' ? 'Propriétaire' : listing.author_role === 'AGENT' ? 'Démarcheur / Agent' : 'Administrateur' }}
              </span>
            </div>
          </div>

          <!-- Message de Prévention Fraude -->
          <div class="bg-amber-950/20 border border-amber-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-300 leading-relaxed">
            <AlertTriangle class="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Conseil de sécurité :</strong> Ne faites jamais de transfert Mobile Money (Wave, Orange Money) avant d'avoir visité le bien avec le propriétaire ou son représentant agréé.
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
