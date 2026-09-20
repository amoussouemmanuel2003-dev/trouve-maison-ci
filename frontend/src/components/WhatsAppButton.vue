<script setup>
import { computed } from 'vue';
import { MessageSquare } from 'lucide-vue-next';

const props = defineProps({
  phone: {
    type: String,
    required: true,
  },
  listingTitle: {
    type: String,
    default: '',
  },
  listingId: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Contacter sur WhatsApp',
  },
  customMessage: {
    type: String,
    default: '',
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
  },
});

const formattedPhone = computed(() => {
  if (!props.phone) return '';
  let clean = props.phone.replace(/[^0-9]/g, '');
  // Format CI automatique si l'utilisateur n'a pas mis l'indicatif 225
  if (!clean.startsWith('225') && clean.length === 10) {
    clean = '225' + clean;
  }
  return clean;
});

const whatsappUrl = computed(() => {
  let msg = props.customMessage;
  if (!msg) {
    msg = props.listingTitle
      ? `Bonjour, je vous contacte depuis la plateforme Trouve Maison CI au sujet de votre annonce : "${props.listingTitle}". Est-elle toujours disponible pour une visite ?`
      : 'Bonjour, je vous contacte depuis la plateforme Trouve Maison CI.';
  }
  return `https://wa.me/${formattedPhone.value}?text=${encodeURIComponent(msg)}`;
});
</script>

<template>
  <a
    :href="whatsappUrl"
    target="_blank"
    rel="noopener noreferrer"
    :class="[
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-950/20 active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white',
      size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-6 py-3.5 text-base' : 'px-4 py-2.5 text-sm',
      fullWidth ? 'w-full' : '',
    ]"
  >
    <MessageSquare class="w-4 h-4 flex-shrink-0 fill-current" />
    <span>{{ label }}</span>
  </a>
</template>
