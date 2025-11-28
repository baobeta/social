import axios from 'axios';
import { getToken, removeToken } from '@/lib/token';
import router from '@/router';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token and redirect to login
      removeToken();

      // Only redirect if not already on login/register page
      const currentRoute = router.currentRoute.value;
      if (currentRoute.name !== 'login' && currentRoute.name !== 'register' && currentRoute.name !== 'home') {
        router.push({ name: 'login', query: { redirect: currentRoute.fullPath } });
      }
    }
    return Promise.reject(error);
  }
);
