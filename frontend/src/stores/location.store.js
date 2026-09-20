import { defineStore } from 'pinia';
import api from '../services/api';

export const useLocationStore = defineStore('location', {
  state: () => ({
    communes: [],
    neighborhoods: {}, // { [communeId]: [...] }
    isLoading: false,
  }),

  actions: {
    async fetchCommunes() {
      if (this.communes.length > 0) return;
      this.isLoading = true;
      try {
        const response = await api.get('/locations/communes');
        this.communes = response.data.data;
      } catch (err) {
        console.error('Erreur communes:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchNeighborhoods(communeId) {
      if (!communeId) return [];
      if (this.neighborhoods[communeId]) return this.neighborhoods[communeId];

      try {
        const response = await api.get(`/locations/neighborhoods/${communeId}`);
        this.neighborhoods[communeId] = response.data.data;
        return response.data.data;
      } catch (err) {
        console.error('Erreur quartiers:', err);
        return [];
      }
    },
  },
});
