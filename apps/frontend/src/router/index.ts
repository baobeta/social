import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    redirect: () => {
      const authStore = useAuthStore();
      return authStore.isAuthenticated ? '/timeline' : '/home';
    },
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: 'Home',
      requiresAuth: false,
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: {
      title: 'Login',
      requiresAuth: false,
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: {
      title: 'Register',
      requiresAuth: false,
    },
  },
  {
    path: '/timeline',
    name: 'timeline',
    component: () => import('@/views/TimelineView.vue'),
    meta: {
      title: 'Timeline',
      requiresAuth: true,
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: {
      title: 'Profile',
      requiresAuth: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '404 Not Found',
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  document.title = (to.meta.title as string) || 'Social Media App';

  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth;

  // Only try to fetch current user if:
  // 1. Route requires authentication, OR
  // 2. User data is not loaded yet AND we're not going to a public route
  if (!authStore.user && !authStore.loading) {
    if (requiresAuth || (to.name !== 'login' && to.name !== 'register' && to.name !== 'home')) {
      try {
        await authStore.fetchCurrentUser();
      } catch (error) {
        // User not authenticated
      }
    }
  }

  const isAuthenticated = authStore.isAuthenticated;

  if (requiresAuth && !isAuthenticated) {
    // Redirect to login if route requires auth and user is not authenticated
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (!requiresAuth && isAuthenticated && (to.name === 'login' || to.name === 'register' || to.name === 'home')) {
    // Redirect to timeline if user is authenticated and tries to access login/register/home
    next({ name: 'timeline' });
  } else {
    next();
  }
});

export default router;
