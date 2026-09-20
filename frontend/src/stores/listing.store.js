import { defineStore } from 'pinia';
import api from '../services/api';

export const useListingStore = defineStore('listing', {
  state: () => ({
    listings: [],
    currentListing: null,
    myListings: [],
    favorites: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 1,
    },
    filters: {
      commune_id: '',
      property_type: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      is_furnished: '',
      search: '',
      sort: 'recent',
    },
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchListings(customParams = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const queryParams = {
          ...this.filters,
          ...customParams,
          page: customParams.page || this.pagination.page,
        };

        // Supprimer les clés vides
        Object.keys(queryParams).forEach((key) => {
          if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
            delete queryParams[key];
          }
        });

        const response = await api.get('/listings', { params: queryParams });
        this.listings = response.data.data;
        this.pagination = response.data.pagination;
      } catch (err) {
        this.error = err.response?.data?.message || 'Erreur lors du chargement des annonces.';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchListingById(id) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get(`/listings/${id}`);
        this.currentListing = response.data.data;
        return this.currentListing;
      } catch (err) {
        this.error = err.response?.data?.message || 'Annonce introuvable.';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async createListing(formData) {
      this.isLoading = true;
      try {
        const response = await api.post('/listings', formData);
        return { success: true, data: response.data.data, message: response.data.message };
      } catch (err) {
        return {
          success: false,
          message: err.response?.data?.message || 'Erreur lors de la création de l\'annonce.',
        };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMyListings() {
      try {
        const response = await api.get('/listings/user/my-listings');
        this.myListings = response.data.data;
      } catch (err) {
        console.error('Erreur my-listings:', err);
      }
    },

    async toggleFavorite(listingId) {
      try {
        const response = await api.post(`/listings/${listingId}/favorite`);
        return response.data;
      } catch (err) {
        console.error('Erreur toggle favorite:', err);
        return { success: false };
      }
    },

    async fetchFavorites() {
      try {
        const response = await api.get('/listings/user/favorites');
        this.favorites = response.data.data;
      } catch (err) {
        console.error('Erreur favorites:', err);
      }
    },

    resetFilters() {
      this.filters = {
        commune_id: '',
        property_type: '',
        min_price: '',
        max_price: '',
        bedrooms: '',
        is_furnished: '',
        search: '',
        sort: 'recent',
      };
      this.pagination.page = 1;
      this.fetchListings();
    },
  },
});
