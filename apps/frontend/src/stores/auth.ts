import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginCredentials, RegisterData } from '@/types/auth';
import * as authService from '@/services/auth.ajax';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // With HttpOnly cookies, authentication is determined by whether we have a valid user
  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await authService.login(credentials);
      user.value = response.data.user;
      // No need to store token - HttpOnly cookies are set automatically by the server
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(data: RegisterData): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await authService.register(data);
      user.value = response.data.user;
      // No need to store token - HttpOnly cookies are set automatically by the server
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Registration failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await authService.logout();
    } catch (err: any) {
      // Continue logout even if API call fails
      console.error('Logout API call failed:', err);
    } finally {
      // Clear local state - cookies are cleared by the server
      user.value = null;
      loading.value = false;
    }
  }

  async function fetchCurrentUser(): Promise<void> {
    // With HttpOnly cookies, we can always try to fetch
    // The browser will automatically send the cookie if it exists
    loading.value = true;
    error.value = null;
    try {
      const response = await authService.getCurrentUser();
      user.value = response.data.user;
    } catch {
      // No valid session or token expired
      user.value = null;
      error.value = null; // Don't show error if not authenticated
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(data: { fullName?: string; displayName?: string | null }): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const profileData: { fullName?: string; displayName?: string | null } = {};
      if (data.fullName !== undefined) {
        profileData.fullName = data.fullName;
      }
      if (data.displayName !== undefined) {
        profileData.displayName = data.displayName;
      }
      const response = await authService.updateProfile(profileData);
      user.value = response.data.user;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Update failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    fetchCurrentUser,
    updateProfile,
    clearError,
    getInitials,
  };
});
