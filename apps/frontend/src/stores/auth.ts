import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginCredentials, RegisterData } from '@/types/auth';
import * as authService from '@/services/auth.ajax';
import { setToken, removeToken, hasToken } from '@/lib/token';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value && hasToken());
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await authService.login(credentials);
      user.value = response.data.user;
      // Store JWT token in localStorage
      setToken(response.data.token);
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
      // Store JWT token in localStorage
      setToken(response.data.token);
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
      // Clear local state and token
      user.value = null;
      removeToken();
      loading.value = false;
    }
  }

  async function fetchCurrentUser(): Promise<void> {
    // Only fetch if we have a token
    if (!hasToken()) {
      user.value = null;
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const response = await authService.getCurrentUser();
      user.value = response.data.user;
    } catch {
      // Token invalid or expired - clear everything
      user.value = null;
      removeToken();
      error.value = null; // Don't show error if not authenticated
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(fullName: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await authService.updateProfile({ fullName });
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
