<script setup>
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 selection:bg-amber-500 selection:text-white">
    <!-- Barre de navigation supérieure -->
    <Navbar />

    <!-- Vue principale avec transition douce -->
    <main class="flex-grow">
      <router-view />
    </main>

    <!-- Pied de page -->
    <Footer />
  </div>
</template>
