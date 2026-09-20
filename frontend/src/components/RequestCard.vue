<script setup>
import { computed } from 'vue';
import { MapPin, Phone, Clock, Bed, Sparkles } from 'lucide-vue-next';
import WhatsAppButton from './WhatsAppButton.vue';

const props = defineProps({
  request: {
    type: Object,
    required: true,
  },
});

const formattedMaxBudget = computed(() => {
  const budget = Number(props.request.max_budget) || 0;
  return new Intl.NumberFormat('fr-FR').format(budget) + ' FCFA';
});

const timeAgo = computed(() => {
  if (!props.request.created_at) return '';
  const date = new Date(props.request.created_at);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
});

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
  return map[props.request.property_type] || props.request.property_type;
});
</script>

<template>
  <div class="bg-[#131d2e] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
    <div>
      <!-- En-tête : Urgence, Date et Budget -->
      <div class="flex items-start justify-between gap-2 mb-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span 
            v-if="request.urgency_level === 'URGENT'" 
            class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
          >
            🔥 Urgent
          </span>
          <span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300">
            {{ propertyTypeLabel }}
          </span>
          <span class="text-xs text-slate-500 flex items-center gap-1">
            <Clock class="w-3 h-3" />
            {{ timeAgo }}
          </span>
        </div>

        <div class="text-right">
          <span class="text-xs text-slate-400 block">Budget max</span>
          <span class="text-sm font-extrabold text-amber-400">{{ formattedMaxBudget }}</span>
        </div>
      </div>

      <!-- Titre de la demande -->
      <h4 class="text-base font-bold text-slate-100 mb-2 leading-snug">
        {{ request.title }}
      </h4>

      <!-- Description détaillée -->
      <p v-if="request.description" class="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
        {{ request.description }}
      </p>

      <!-- Critères clés -->
      <div class="flex items-center gap-3 text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
        <div class="flex items-center gap-1 text-amber-400/90 font-medium">
          <MapPin class="w-3.5 h-3.5" />
          <span>{{ request.commune_name || 'Abidjan' }}</span>
          <span v-if="request.neighborhood_name" class="text-slate-400 font-normal">({{ request.neighborhood_name }})</span>
        </div>

        <div v-if="request.bedrooms_min" class="flex items-center gap-1">
          <Bed class="w-3.5 h-3.5 text-slate-500" />
          <span>{{ request.bedrooms_min }} ch. min</span>
        </div>

        <div v-if="request.is_furnished" class="flex items-center gap-1 text-emerald-400">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Meublé souhaité</span>
        </div>
      </div>
    </div>

    <!-- Contact du locataire -->
    <div class="flex items-center justify-between gap-3 pt-2">
      <div class="text-xs">
        <span class="text-slate-500 block">Chercheur</span>
        <span class="font-semibold text-slate-300">{{ request.user_name || 'Locataire' }}</span>
      </div>

      <div class="flex items-center gap-2">
        <a 
          :href="'tel:' + request.contact_phone"
          class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          title="Appeler"
        >
          <Phone class="w-4 h-4" />
        </a>

        <WhatsAppButton 
          :phone="request.contact_whatsapp || request.contact_phone"
          :custom-message="`Bonjour ${request.user_name || ''}, j'ai vu votre recherche '${request.title}' sur Trouve Maison CI. J'ai un bien qui pourrait correspondre à votre budget.`"
          label="Proposer un bien"
          size="sm"
        />
      </div>
    </div>
  </div>
</template>
