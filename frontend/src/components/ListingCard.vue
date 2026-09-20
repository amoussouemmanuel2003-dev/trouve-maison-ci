<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Bed, Bath, Maximize2, MapPin, Zap, Droplet, Heart } from 'lucide-vue-next';
import WhatsAppButton from './WhatsAppButton.vue';

const props = defineProps({
  listing: {
    type: Object,
    required: true,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['toggle-favorite']);
const router = useRouter();

// Format du prix en FCFA
const formattedPrice = computed(() => {
  const price = Number(props.listing.monthly_rent) || 0;
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
});

// Image principale avec fallback de qualité
const primaryImage = computed(() => {
  if (props.listing.images && props.listing.images.length > 0) {
    return props.listing.images[0].image_url;
  }
  return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';
});

// Libellé lisible du type de bien
const propertyTypeLabel = computed(() => {
  const map = {
    HOUSE: 'Maison',
    APARTMENT: 'Appartement',
    STUDIO: 'Studio',
    ROOM: 'Chambre',
    VILLA: 'Villa',
    FLATSHARE: 'Colocation',
    LAND: 'Terrain',
  };
  return map[props.listing.property_type] || props.listing.property_type;
});

const goToDetail = () => {
  router.push(`/annonces/${props.listing.id}`);
};
</script>

<template>
  <div class="group bg-[#131d2e] border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
    <!-- Image et Badges supérieurs -->
    <div class="relative aspect-[16/10] overflow-hidden bg-slate-900 cursor-pointer" @click="goToDetail">
      <img 
        :src="primaryImage" 
        :alt="listing.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      
      <!-- Gradient overlay pour lisibilité -->
      <div class="absolute inset-0 bg-gradient-to-t from-[#131d2e] via-transparent to-black/40"></div>

      <!-- Badge Type de bien & Vedette -->
      <div class="absolute top-3 left-3 flex gap-2 flex-wrap">
        <span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/60 backdrop-blur-md text-amber-400 border border-amber-400/20">
          {{ propertyTypeLabel }}
        </span>
        <span v-if="listing.is_featured" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/90 text-white shadow-md">
          ⭐ En vedette
        </span>
      </div>

      <!-- Bouton Favori -->
      <button 
        @click.stop="emit('toggle-favorite', listing.id)" 
        class="absolute top-3 right-3 p-2 rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md text-slate-300 hover:text-rose-400 transition-colors"
        title="Ajouter aux favoris"
      >
        <Heart class="w-4 h-4" :class="{ 'fill-rose-500 text-rose-500': isFavorite }" />
      </button>

      <!-- Prix en FCFA -->
      <div class="absolute bottom-3 left-3">
        <div class="text-xl font-extrabold text-white tracking-tight drop-shadow-md">
          {{ formattedPrice }}
          <span class="text-xs font-normal text-slate-300">/ mois</span>
        </div>
      </div>
    </div>

    <!-- Corps de la carte -->
    <div class="p-4 flex-1 flex flex-col justify-between cursor-pointer" @click="goToDetail">
      <div>
        <!-- Localisation (Commune & Quartier) -->
        <div class="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-1.5">
          <MapPin class="w-3.5 h-3.5 flex-shrink-0" />
          <span class="truncate">{{ listing.commune_name || 'Abidjan' }}</span>
          <span v-if="listing.neighborhood_name" class="text-slate-500">• {{ listing.neighborhood_name }}</span>
        </div>

        <!-- Titre de l'annonce -->
        <h3 class="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug mb-3">
          {{ listing.title }}
        </h3>
      </div>

      <!-- Spécifications & Compteurs -->
      <div class="space-y-3 pt-2 border-t border-slate-800/80">
        <!-- Chambres / SDB / Surface -->
        <div class="flex items-center gap-3 text-xs text-slate-400">
          <div v-if="listing.bedrooms" class="flex items-center gap-1">
            <Bed class="w-3.5 h-3.5 text-slate-500" />
            <span>{{ listing.bedrooms }} ch.</span>
          </div>
          <div v-if="listing.bathrooms" class="flex items-center gap-1">
            <Bath class="w-3.5 h-3.5 text-slate-500" />
            <span>{{ listing.bathrooms }} sdb</span>
          </div>
          <div v-if="listing.surface_area" class="flex items-center gap-1">
            <Maximize2 class="w-3.5 h-3.5 text-slate-500" />
            <span>{{ listing.surface_area }} m²</span>
          </div>
          <span v-if="listing.is_furnished" class="ml-auto text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            Meublé
          </span>
        </div>

        <!-- Compteurs CIE / SODECI Spécifiques Abidjan -->
        <div class="flex items-center gap-2 text-[11px] text-slate-400">
          <div class="flex items-center gap-1 bg-slate-800/60 px-2 py-1 rounded" :title="'Électricité CIE: ' + listing.electricity_meter_type">
            <Zap class="w-3 h-3 text-yellow-400" />
            <span>CIE: {{ listing.electricity_meter_type === 'INDIVIDUAL' ? 'Indiv.' : 'Sous-c.' }}</span>
          </div>
          <div class="flex items-center gap-1 bg-slate-800/60 px-2 py-1 rounded" :title="'Eau SODECI: ' + listing.water_meter_type">
            <Droplet class="w-3 h-3 text-cyan-400" />
            <span>SODECI: {{ listing.water_meter_type === 'INDIVIDUAL' ? 'Indiv.' : 'Partagé' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions du bas -->
    <div class="p-3 bg-[#0f172a] border-t border-slate-800/80 flex items-center gap-2">
      <button 
        @click="goToDetail"
        class="flex-1 py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl transition-colors text-center"
      >
        Voir détails
      </button>

      <!-- Bouton WhatsApp direct -->
      <div @click.stop class="flex-1">
        <WhatsAppButton 
          :phone="listing.whatsapp_contact || '+2250700000000'"
          :listing-title="listing.title"
          :listing-id="listing.id"
          label="WhatsApp"
          size="sm"
          :full-width="true"
        />
      </div>
    </div>
  </div>
</template>
