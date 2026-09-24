<script setup>
import { ref, onMounted, computed } from 'vue';
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
  Rocket,
  DollarSign,
  Phone,
  CreditCard,
  TrendingUp
} from 'lucide-vue-next';

const stats = ref(null);
const pendingListings = ref([]);
const allListings = ref([]);
const users = ref([]);
const boostRequests = ref([]);
const activeSection = ref('moderation'); // 'moderation', 'boosts', 'all_listings', 'users'
const isLoading = ref(false);
const boostFilter = ref('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED', 'ALL'

const filteredBoosts = computed(() => {
  if (boostFilter.value === 'ALL') return boostRequests.value;
  return boostRequests.value.filter(b => b.status === boostFilter.value);
});

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

    // Charger les demandes de boost
    try {
      const boostsRes = await api.get('/admin/boosts');
      boostRequests.value = boostsRes.data.data;
    } catch (e) {
      console.warn('Boost requests non disponible:', e.message);
    }
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

// Gestion des Boosts
const reviewBoostNote = ref('');

const approveBoost = async (boostId) => {
  if (confirm('Confirmer que le paiement Mobile Money a bien été reçu et activer le boost ?')) {
    try {
      await api.put(`/admin/boosts/${boostId}/review`, {
        status: 'APPROVED',
        admin_note: reviewBoostNote.value || 'Paiement vérifié et boost activé.'
      });
      reviewBoostNote.value = '';
      await loadAdminData();
      alert('✅ Boost approuvé ! L\'annonce est maintenant à la une.');
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.message || err.message));
    }
  }
};

const rejectBoost = async (boostId) => {
  const reason = prompt('Raison du rejet (ex: Paiement non reçu, montant incorrect, etc.) :');
  if (reason !== null) {
    try {
      await api.put(`/admin/boosts/${boostId}/review`, {
        status: 'REJECTED',
        admin_note: reason || 'Paiement non confirmé.'
      });
      await loadAdminData();
      alert('❌ Demande de boost rejetée.');
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.message || err.message));
    }
  }
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(amount);
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
    <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <div class="bg-[#131d2e] border border-slate-800 p-5 rounded-2xl">
        <span class="text-xs text-slate-400 block">Total Annonces</span>
        <span class="text-2xl font-black text-white">{{ stats.total_listings }}</span>
      </div>
      <div class="bg-[#131d2e] border border-amber-500/30 p-5 rounded-2xl">
        <span class="text-xs text-amber-400 block">En attente</span>
        <span class="text-2xl font-black text-amber-400">{{ stats.pending_listings }}</span>
      </div>
      <div class="bg-[#131d2e] border border-emerald-500/30 p-5 rounded-2xl">
        <span class="text-xs text-emerald-400 block">Annonces actives</span>
        <span class="text-2xl font-black text-emerald-400">{{ stats.active_listings }}</span>
      </div>
      <div class="bg-[#131d2e] border border-slate-800 p-5 rounded-2xl">
        <span class="text-xs text-slate-400 block">Utilisateurs</span>
        <span class="text-2xl font-black text-white">{{ stats.total_users }}</span>
      </div>
      <div class="bg-[#131d2e] border border-amber-500/30 p-5 rounded-2xl">
        <span class="text-xs text-amber-400 block flex items-center gap-1">
          <Rocket class="w-3 h-3" /> Boosts en attente
        </span>
        <span class="text-2xl font-black text-amber-400">{{ stats.pending_boosts || 0 }}</span>
      </div>
      <div class="bg-[#131d2e] border border-emerald-500/30 p-5 rounded-2xl">
        <span class="text-xs text-emerald-400 block flex items-center gap-1">
          <TrendingUp class="w-3 h-3" /> Revenus Boosts
        </span>
        <span class="text-2xl font-black text-emerald-400">{{ formatMoney(stats.boost_revenue || 0) }} F</span>
      </div>
    </div>

    <!-- Onglets -->
    <div class="flex border-b border-slate-800 space-x-4 sm:space-x-6 text-sm font-semibold overflow-x-auto">
      <button 
        @click="activeSection = 'moderation'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap',
          activeSection === 'moderation' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Clock class="w-4 h-4" />
        <span>Modération ({{ pendingListings.length }})</span>
      </button>

      <button 
        @click="activeSection = 'boosts'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap',
          activeSection === 'boosts' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <CreditCard class="w-4 h-4" />
        <span>Paiements & Boosts ({{ boostRequests.filter(b => b.status === 'PENDING').length }})</span>
      </button>

      <button 
        @click="activeSection = 'all_listings'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap',
          activeSection === 'all_listings' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Building class="w-4 h-4" />
        <span>Annonces & Boosts ({{ allListings.length }})</span>
      </button>

      <button 
        @click="activeSection = 'users'"
        :class="[
          'pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap',
          activeSection === 'users' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        <Users class="w-4 h-4" />
        <span>Utilisateurs</span>
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
              {{ formatMoney(listing.monthly_rent) }} FCFA / mois
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
              <span>Valider</span>
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

    <!-- 3. GESTION DES PAIEMENTS / BOOST REQUESTS -->
    <div v-else-if="activeSection === 'boosts'">
      <!-- Filtres -->
      <div class="flex items-center gap-2 mb-6 flex-wrap">
        <button 
          v-for="f in [{value: 'PENDING', label: '⏳ En attente', color: 'amber'}, {value: 'APPROVED', label: '✅ Approuvés', color: 'emerald'}, {value: 'REJECTED', label: '❌ Rejetés', color: 'red'}, {value: 'ALL', label: '📋 Tous', color: 'slate'}]"
          :key="f.value"
          @click="boostFilter = f.value"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all',
            boostFilter === f.value 
              ? `border-${f.color}-500 bg-${f.color}-500/10 text-${f.color}-400` 
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
          ]"
        >
          {{ f.label }} ({{ f.value === 'ALL' ? boostRequests.length : boostRequests.filter(b => b.status === f.value).length }})
        </button>
      </div>

      <div v-if="filteredBoosts.length === 0" class="text-center py-16 bg-[#131d2e] border border-slate-800 rounded-3xl">
        <CreditCard class="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <p class="text-slate-400 text-sm">Aucune demande de boost trouvée.</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="boost in filteredBoosts" 
          :key="boost.id"
          :class="[
            'bg-[#131d2e] border p-6 rounded-3xl space-y-4',
            boost.status === 'PENDING' ? 'border-amber-500/30' :
            boost.status === 'APPROVED' ? 'border-emerald-500/20' : 'border-red-500/20'
          ]"
        >
          <!-- En-tête -->
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="space-y-2 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span 
                  :class="[
                    'px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase',
                    boost.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                    boost.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  ]"
                >
                  {{ boost.status === 'APPROVED' ? '✅ Approuvé' : boost.status === 'PENDING' ? '⏳ En attente' : '❌ Rejeté' }}
                </span>
                <span class="text-xs text-slate-500">{{ formatDate(boost.created_at) }}</span>
              </div>

              <h4 class="font-bold text-white">{{ boost.listing_title }}</h4>

              <!-- Infos utilisateur -->
              <div class="flex items-center gap-4 flex-wrap text-xs">
                <span class="text-slate-400 flex items-center gap-1">
                  <Users class="w-3 h-3" /> {{ boost.user_name }}
                </span>
                <span class="text-slate-400 flex items-center gap-1">
                  <Phone class="w-3 h-3" /> {{ boost.user_phone }}
                </span>
                <span class="text-slate-400">Rôle: {{ boost.user_role }}</span>
              </div>
            </div>
          </div>

          <!-- Détails du paiement -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span class="text-slate-500 block">Montant</span>
              <span class="text-amber-400 font-black text-base">{{ formatMoney(boost.amount) }} FCFA</span>
            </div>
            <div>
              <span class="text-slate-500 block">Opérateur</span>
              <span class="text-white font-bold">
                {{ boost.payment_method === 'WAVE' ? '🌊 Wave' : 
                   boost.payment_method === 'ORANGE' ? '🍊 Orange Money' : 
                   boost.payment_method === 'MTN' ? '🟡 MTN MoMo' : '🔵 Moov Money' }}
              </span>
            </div>
            <div>
              <span class="text-slate-500 block">Référence Transaction</span>
              <span class="text-white font-mono font-bold">{{ boost.transaction_reference }}</span>
            </div>
            <div>
              <span class="text-slate-500 block">Tél. Expéditeur</span>
              <span class="text-white font-bold">{{ boost.phone_sender || 'Non renseigné' }}</span>
            </div>
          </div>

          <!-- Boutons d'action (uniquement pour les demandes en attente) -->
          <div v-if="boost.status === 'PENDING'" class="flex items-center gap-3 pt-2">
            <button 
              @click="approveBoost(boost.id)"
              class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 transition-all"
            >
              <CheckCircle class="w-4 h-4" />
              <span>✅ Paiement reçu — Activer le Boost</span>
            </button>

            <button 
              @click="rejectBoost(boost.id)"
              class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/20 transition-all"
            >
              <XCircle class="w-4 h-4" />
              <span>❌ Paiement non reçu — Rejeter</span>
            </button>
          </div>

          <!-- Note admin (si rejeté) -->
          <div v-if="boost.admin_note && boost.status !== 'PENDING'" class="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl">
            <strong>Note admin :</strong> {{ boost.admin_note }}
          </div>
        </div>
      </div>
    </div>

    <!-- 4. TOUTES LES ANNONCES ACTIVES & GESTION BOOSTS -->
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
              {{ formatMoney(listing.monthly_rent) }} FCFA / mois
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

    <!-- 5. GESTION DES UTILISATEURS -->
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
