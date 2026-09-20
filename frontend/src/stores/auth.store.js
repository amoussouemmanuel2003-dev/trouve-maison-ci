import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('tmci_user') || 'null'),
    token: localStorage.getItem('tmci_token') || null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isLandlord: (state) => state.user?.role === 'LANDLORD',
    isAgent: (state) => state.user?.role === 'AGENT',
    isPublisher: (state) => ['LANDLORD', 'AGENT', 'ADMIN'].includes(state.user?.role),
    userRole: (state) => state.user?.role || 'GUEST',
  },

  actions: {
    async login(identifier, password) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post('/auth/login', { identifier, password });
        const { token, user } = response.data;

        this.token = token;
        this.user = user;

        localStorage.setItem('tmci_token', token);
        localStorage.setItem('tmci_user', JSON.stringify(user));

        return { success: true, user };
      } catch (err) {
        this.error = err.response?.data?.message || 'Identifiants invalides.';
        return { success: false, message: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async register(userData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post('/auth/register', userData);
        const { token, user } = response.data;

        this.token = token;
        this.user = user;

        localStorage.setItem('tmci_token', token);
        localStorage.setItem('tmci_user', JSON.stringify(user));

        return { success: true, user };
      } catch (err) {
        this.error = err.response?.data?.message || 'Échec de l\'inscription.';
        return { success: false, message: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProfile() {
      if (!this.token) return;
      try {
        const response = await api.get('/auth/me');
        this.user = response.data.user;
        localStorage.setItem('tmci_user', JSON.stringify(this.user));
      } catch (err) {
        this.logout();
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.error = null;
      localStorage.removeItem('tmci_token');
      localStorage.removeItem('tmci_user');
    },
  },
});
