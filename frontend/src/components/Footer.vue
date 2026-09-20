<script setup>
import { Building, Heart } from 'lucide-vue-next';
</script>

<template>
  <footer class="bg-[#080c14] border-t border-slate-800/80 text-slate-400 text-sm mt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <!-- Col 1 : À propos -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white font-bold">
              <Building class="w-5 h-5" />
            </div>
            <span class="text-lg font-bold text-white">Trouve Maison <span class="text-[#FF8200]">CI</span></span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            La plateforme immobilière de référence pour louer et trouver son logement à Abidjan et partout en Côte d'Ivoire en toute sérénité.
          </p>
        </div>

        <!-- Col 2 : Communes phares -->
        <div>
          <h4 class="text-white font-semibold mb-3 text-sm">Communes d'Abidjan</h4>
          <ul class="space-y-2 text-xs">
            <li><router-link to="/annonces?commune_id=1" class="hover:text-amber-400">Cocody (Angré, Riviera, 2 Plateaux)</router-link></li>
            <li><router-link to="/annonces?commune_id=2" class="hover:text-amber-400">Yopougon (Maroc, Niangon, Siporex)</router-link></li>
            <li><router-link to="/annonces?commune_id=3" class="hover:text-amber-400">Marcory (Zone 4, Biétry)</router-link></li>
            <li><router-link to="/annonces?commune_id=4" class="hover:text-amber-400">Plateau</router-link></li>
            <li><router-link to="/annonces?commune_id=11" class="hover:text-amber-400">Bingerville</router-link></li>
          </ul>
        </div>

        <!-- Col 3 : Types de biens -->
        <div>
          <h4 class="text-white font-semibold mb-3 text-sm">Types de logements</h4>
          <ul class="space-y-2 text-xs">
            <li><router-link to="/annonces?property_type=STUDIO" class="hover:text-amber-400">Studios à louer</router-link></li>
            <li><router-link to="/annonces?property_type=APARTMENT" class="hover:text-amber-400">Appartements (2 & 3 pièces)</router-link></li>
            <li><router-link to="/annonces?property_type=VILLA" class="hover:text-amber-400">Villas & Duplex</router-link></li>
            <li><router-link to="/je-cherche" class="hover:text-amber-400">Demandes de locataires</router-link></li>
          </ul>
        </div>

        <!-- Col 4 : Sécurité & Transparence -->
        <div>
          <h4 class="text-white font-semibold mb-3 text-sm">Transparence & Cautions</h4>
          <p class="text-xs text-slate-400 leading-relaxed mb-3">
            Trouve Maison CI promeut la clarté : affichage précis des compteurs CIE / SODECI et respect des plafonds de caution en vigueur en Côte d'Ivoire.
          </p>
          <div class="text-xs text-slate-500">
            Contact : support@trouvemaison.ci
          </div>
        </div>
      </div>

      <div class="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          &copy; {{ new Date().getFullYear() }} Trouve Maison CI. Tous droits réservés.
        </div>
        <div class="flex items-center gap-1">
          Fait avec <Heart class="w-3.5 h-3.5 text-rose-500 fill-current" /> pour la Côte d'Ivoire 🇨🇮
        </div>
      </div>
    </div>
  </footer>
</template>
