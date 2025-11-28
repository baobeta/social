import axios from 'axios';
import router from '@/router';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANT: Enable sending cookies with requests for HttpOnly cookies
});

// Response interceptor - Handle auth errors
// Note: With HttpOnly cookies, tokens are automatically sent with each request
// and refreshed automatically by the backend middleware
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      // Only redirect if not already on login/register page
      const currentRoute = router.currentRoute.value;
      if (currentRoute.name !== 'login' && currentRoute.name !== 'register' && currentRoute.name !== 'home') {
        router.push({ name: 'login', query: { redirect: currentRoute.fullPath } });
      }
    }
    return Promise.reject(error);
  }
);
