<template>
  <nav class="bg-surface-card border-b border-gray-100 sticky top-0 z-50 shadow-sm">
    <div class="max-w-5xl mx-auto px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <NavbarBrand />

        <div class="flex items-center gap-6">
          <NavbarUserInfo
            :full-name="authStore.user!.fullName"
            :username="authStore.user!.username"
            :is-admin="authStore.isAdmin"
          />
          <NavbarActions
            @profile="router.push('/profile')"
            @logout="handleLogout"
          />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import NavbarBrand from './navbar/NavbarBrand.vue';
import NavbarUserInfo from './navbar/NavbarUserInfo.vue';
import NavbarActions from './navbar/NavbarActions.vue';

const authStore = useAuthStore();
const router = useRouter();

async function handleLogout() {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
</script>
