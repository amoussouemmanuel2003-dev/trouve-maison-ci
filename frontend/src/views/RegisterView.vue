<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { Building, AlertCircle, CheckCircle2 } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  full_name: '',
  phone: '',
  email: '',
  password: '',
  whatsapp_number: '',
  role: 'USER', // 'USER', 'LANDLORD', 'AGENT'
});

const errorMessage = ref('');
const isLoading = ref(false);

const handleRegister = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  const result = await authStore.register(form.value);
  isLoading.value = false;

  if (result.success) {
    router.push('/mon-espace');
  } else {
    errorMessage.value = result.message;
  }
};
</script>

<template>
  <div class="min-h-[85vh] flex items-center justify-center px-4 py-12">
    <div class="max-w-lg w-full bg-[#131d2e] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
          <Building class="w-6 h-6" />
        </div>
        <h2 class="text-2xl font-extrabold text-white">Rejoindre Trouve Maison CI</h2>
        <p class="text-xs text-slate-400">Créez votre compte en quelques secondes</p>
      </div>

      <!-- Erreur -->
      <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4 text-xs">
        <!-- RÔLE -->
        <div>
          <label class="block font-semibold text-slate-300 mb-2">Vous êtes :</label>
          <div class="grid grid-cols-3 gap-2">
            <button 
              type="button" 
              @click="form.role = 'USER'"
              :class="[
                'p-3 rounded-xl border text-center transition-all',
                form.role === 'USER' ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold' : 'border-slate-700 bg-slate-900 text-slate-400'
              ]"
            >
              Chercheur
            </button>
            <button 
              type="button" 
              @click="form.role = 'LANDLORD'"
              :class="[
                'p-3 rounded-xl border text-center transition-all',
                form.role === 'LANDLORD' ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold' : 'border-slate-700 bg-slate-900 text-slate-400'
              ]"
            >
              Propriétaire
            </button>
            <button 
              type="button" 
              @click="form.role = 'AGENT'"
              :class="[
                'p-3 rounded-xl border text-center transition-all',
                form.role === 'AGENT' ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold' : 'border-slate-700 bg-slate-900 text-slate-400'
              ]"
            >
              Démarcheur
            </button>
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-300 mb-1">Nom complet ou Raison sociale *</label>
          <input 
            v-model="form.full_name" 
            required
            type="text" 
            placeholder="Ex: Kouassi Jean-Baptiste"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Téléphone (Format CI) *</label>
            <input 
              v-model="form.phone" 
              required
              type="tel" 
              placeholder="+22507..."
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Numéro WhatsApp</label>
            <input 
              v-model="form.whatsapp_number" 
              type="tel" 
              placeholder="+22507..."
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-300 mb-1">Adresse Email (optionnel)</label>
          <input 
            v-model="form.email" 
            type="email" 
            placeholder="jean@exemple.ci"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-300 mb-1">Mot de passe *</label>
          <input 
            v-model="form.password" 
            required
            type="password" 
            placeholder="Minimum 6 caractères"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50 mt-2"
        >
          <span v-if="isLoading">Création du compte...</span>
          <span v-else>Créer mon compte</span>
        </button>
      </form>

      <div class="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
        Vous avez déjà un compte ?
        <router-link to="/connexion" class="font-bold text-amber-400 hover:underline ml-1">
          Se connecter
        </router-link>
      </div>
    </div>
  </div>
</template>
