<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { Building, Lock, Phone, AlertCircle } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const identifier = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  const result = await authStore.login(identifier.value, password.value);
  isLoading.value = false;

  if (result.success) {
    const redirectPath = route.query.redirect || '/mon-espace';
    router.push(redirectPath);
  } else {
    errorMessage.value = result.message;
  }
};
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full bg-[#131d2e] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
          <Building class="w-6 h-6" />
        </div>
        <h2 class="text-2xl font-extrabold text-white">Connexion</h2>
        <p class="text-xs text-slate-400">Accédez à votre espace Trouve Maison CI</p>
      </div>

      <!-- Erreur -->
      <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Numéro de téléphone ou Email</label>
          <div class="relative">
            <input 
              v-model="identifier" 
              required
              type="text" 
              placeholder="Votre numéro ou votre adresse e-mail"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-300 mb-1.5">Mot de passe</label>
          <div class="relative">
            <input 
              v-model="password" 
              required
              type="password" 
              placeholder="••••••••"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-98 disabled:opacity-50"
        >
          <span v-if="isLoading">Connexion...</span>
          <span v-else>Se connecter</span>
        </button>
      </form>

      <div class="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
        Pas encore de compte ?
        <router-link to="/inscription" class="font-bold text-amber-400 hover:underline ml-1">
          Créer un compte
        </router-link>
      </div>


    </div>
  </div>
</template>
