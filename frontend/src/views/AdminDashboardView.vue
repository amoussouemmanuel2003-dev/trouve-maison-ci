<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Users, 
  Building, 
  Clock, 
  AlertCircle,
  Eye,
  Star,
  Trash2,
  Rocket
} from 'lucide-vue-next';

const stats = ref(null);
const pendingListings = ref([]);
const allListings = ref([]);
const users = ref([]);
const activeSection = ref('moderation'); // 'moderation', 'all_listings', 'users'
const isLoading = ref(false);

const loadAdminData = async () => {
  isLoading.value = true;
  try {
    const statsRes = await api.get('/admin/stats');
    stats.value = statsRes.data.data;

    const pendingRes = await api.get('/admin/listings/pending');
    pendingListings.value = pendingRes.data.data;

    const allRes = await api.get('/listings?status=ACTIVE&limit=100');
    allListings.value = allRes.data.data;

    const usersRes = await api.get('/admin/users?limit=50');
    users.value = usersRes.data.data;
  } catch (err) {
    console.error('Erreur chargement admin:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadAdminData);

const moderate = async (id, status) => {
  try {
    await api.put(`/admin/listings/${id}/moderate`, { status });
    await loadAdminData();
  } catch (err) {
    alert('Erreur modération: ' + (err.response?.data?.message || err.message));
  }
};

const toggleFeatured = async (listing) => {
  try {
    const newFeatured = !listing.is_featured;
    await api.put(`/admin/listings/${listing.id}/moderate`, { 
      status: listing.status, 
      is_featured: newFeatured 
    });
    listing.is_featured = newFeatured;
    alert(newFeatured ? 'Annonce passée À LA UNE avec succès !' : 'Boost retiré.');
  } catch (err) {
    alert('Erreur modification Boost: ' + (err.response?.data?.message || err.message));
  }
};

const deleteListingAdmin = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?')) {
    try {
      await api.delete(`/listings/${id}`);
      await loadAdminData();
      alert('Annonce supprimée avec succès.');
    } catch (err) {
      alert('Erreur suppression: ' + (err.response?.data?.message || err.message));
    }
  }
};

const changeUserRole = async (userId, newRole) => {
  try {
    await api.put(`/admin/users/${userId}/role`, { role: newRole });
    alert(`Rôle mis à jour en ${newRole}`);
  } catch (err) {
    alert('Erreur: ' + (err.response?.data?.message || err.message));
  }
};

const toggleUserStatus = async (user) => {
  try {
    const newStatus = !user.is_active;
    await api.put(`/admin/users/${user.id}/status`, { is_active: newStatus });
    user.is_active = newStatus;
  } catch (err) {
    alert('Erreur statut: ' + (err.response?.data?.message || err.message));
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <div class="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
          <Shield class="w-4 h-4" />
          <span>Super Administrateur</span>
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">
          Panneau de Modération & Administration
        </h1>
      </div>
    </div>

    <!-- 1. STATISTIQUES GLOBALES -->
    <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-[#131d2e] border border-slate-800 p-5 rounded-2xl">
        <span class="text-xs text-slate-400 block">Total Annonces</span>
        <span class="text-2xl font-black text-white">{{ stats.total_listings }}</span>
      </div>
      <div class="bg-[#131d2e] border border-amber-500/30 p-5 rounded-2xl">
        <span class="text-xs text-amber-400 block">En attente de validation</span>
        <span class="text-2xl font-black text-amber-400">{{ stats.pending_listings }}</span>
      </div>
      <div class="bg-[#131d2e] border border-emerald-500/30 p-5 rounded-2xl">
        <span class="text-xs text-emerald-400 block">Annonces actives</span>
        <span class="text-2xl font-black text-emerald-400">{{ stats.active_listings }}</span>
      </div>
      <div class="bg-[#131d2e] border border-slate-800 p-5 rounded-2xl">
        <span class="text-xs text-slate-400 block">Total Utilisateurs</span>
        <span class="text-2xl font-black text-white">{{ stats.total_users }}</span>
      </div>
    </div>

    <!-- Onglets Modération / Annonces Actives / Utilisateurs -->
    <div class="flex border-b border-slate-800 space-x-6 text-sm font-semibold overflow-x-auto">
      <button 
        @click="activeSection = 'moderation'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap',
          activeSection === 'moderation' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Clock class="w-4 h-4" />
        <span>En attente de validation ({{ pendingListings.length }})</span>
      </button>

      <button 
        @click="activeSection = 'all_listings'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap',
          activeSection === 'all_listings' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Building class="w-4 h-4" />
        <span>Toutes les Annonces & Boosts ({{ allListings.length }})</span>
      </button>

      <button 
        @click="activeSection = 'users'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap',
          activeSection === 'users' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Users class="w-4 h-4" />
        <span>Gestion des Utilisateurs</span>
      </button>
    </div>

    <!-- 2. FILE DE MODÉRATION -->
    <div v-if="activeSection === 'moderation'">
      <div v-if="pendingListings.length === 0" class="text-center py-16 bg-[#131d2e] border border-slate-800 rounded-3xl">
        <CheckCircle class="w-10 h-10 text-emerald-400 mx-auto mb-2" />
        <p class="text-slate-200 font-bold">Aucune annonce en attente de modération</p>
        <p class="text-xs text-slate-400 mt-1">Toutes les offres soumises ont été traitées.</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="listing in pendingListings" 
          :key="listing.id"
          class="bg-[#131d2e] border border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                En attente
              </span>
              <span class="text-xs font-semibold text-slate-400">{{ listing.commune_name }}</span>
              <span class="text-xs text-slate-500">• Déposé par {{ listing.author_name }} ({{ listing.author_phone }})</span>
            </div>

            <h3 class="text-lg font-bold text-white">{{ listing.title }}</h3>
            <p class="text-xs text-slate-400 line-clamp-2">{{ listing.description }}</p>

            <div class="text-sm font-black text-amber-400">
              {{ new Intl.NumberFormat('fr-FR').format(listing.monthly_rent) }} FCFA / mois
            </div>
          </div>

          <!-- Boutons de Décision Modération -->
          <div class="flex items-center gap-3">
            <router-link 
              :to="`/annonces/${listing.id}`" 
              class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <Eye class="w-4 h-4" />
              <span>Aperçu</span>
            </router-link>

            <button 
              @click="moderate(listing.id, 'ACTIVE')" 
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
            >
              <CheckCircle class="w-4 h-4" />
              <span>Valider (Mettre en ligne)</span>
            </button>

            <button 
              @click="moderate(listing.id, 'REJECTED')" 
              class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/20"
            >
              <XCircle class="w-4 h-4" />
              <span>Rejeter</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. TOUTES LES ANNONCES ACTIVES & GESTION BOOSTS -->
    <div v-else-if="activeSection === 'all_listings'">
      <div v-if="allListings.length === 0" class="text-center py-16 bg-[#131d2e] border border-slate-800 rounded-3xl text-slate-400">
        Aucune annonce active sur la plateforme.
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="listing in allListings" 
          :key="listing.id"
          class="bg-[#131d2e] border border-slate-800 p-5 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span 
                v-if="listing.is_featured" 
                class="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 flex items-center gap-1"
              >
                <Star class="w-3 h-3 fill-current" />
                <span>⭐ À LA UNE (Boostée)</span>
              </span>
              <span class="text-xs font-bold text-slate-400">{{ listing.commune_name }}</span>
              <span class="text-xs text-slate-500">• Vendeur: {{ listing.author_name }}</span>
            </div>

            <h4 class="text-base font-bold text-white">{{ listing.title }}</h4>
            <div class="text-amber-400 font-extrabold text-sm">
              {{ new Intl.NumberFormat('fr-FR').format(listing.monthly_rent) }} FCFA / mois
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button 
              @click="toggleFeatured(listing)"
              :class="[
                'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all',
                listing.is_featured ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              ]"
            >
              <Rocket class="w-4 h-4 text-amber-400" />
              <span>{{ listing.is_featured ? 'Retirer "À la une"' : 'Passer "À la une"' }}</span>
            </button>

            <router-link 
              :to="`/annonces/${listing.id}`" 
              class="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              title="Voir"
            >
              <Eye class="w-4 h-4" />
            </router-link>

            <button 
              @click="deleteListingAdmin(listing.id)" 
              class="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
              title="Supprimer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. GESTION DES UTILISATEURS -->
    <div v-else-if="activeSection === 'users'">
      <div class="bg-[#131d2e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th class="p-4">Utilisateur</th>
                <th class="p-4">Téléphone</th>
                <th class="p-4">Rôle</th>
                <th class="p-4">Statut</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr v-for="u in users" :key="u.id" class="hover:bg-slate-800/40">
                <td class="p-4 font-semibold text-white">
                  {{ u.full_name }}
                  <span v-if="u.email" class="block text-[11px] text-slate-500 font-normal">{{ u.email }}</span>
                </td>
                <td class="p-4">{{ u.phone }}</td>
                <td class="p-4">
                  <select 
                    :value="u.role" 
                    @change="changeUserRole(u.id, $event.target.value)"
                    class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="USER">USER (Chercheur)</option>
                    <option value="LANDLORD">LANDLORD (Propriétaire)</option>
                    <option value="AGENT">AGENT (Démarcheur)</option>
                    <option value="ADMIN">ADMIN (Super Admin)</option>
                  </select>
                </td>
                <td class="p-4">
                  <span 
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    ]"
                  >
                    {{ u.is_active ? 'Actif' : 'Suspendu' }}
                  </span>
                </td>
                <td class="p-4 text-right">
                  <button 
                    @click="toggleUserStatus(u)"
                    :class="[
                      'px-3 py-1 rounded-lg text-xs font-semibold',
                      u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    ]"
                  >
                    {{ u.is_active ? 'Suspendre' : 'Réactiver' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
