<template>
  <nav class="bg-surface-card border-b border-gray-100 sticky top-0 z-50 shadow-sm">
    <div class="max-w-5xl mx-auto px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <!-- Brand -->
        <div class="flex items-center">
          <RouterLink to="/timeline" class="text-2xl font-bold text-primary-500 hover:text-primary-600 transition-colors">
            Social
          </RouterLink>
        </div>

        <!-- User Info & Actions -->
        <div class="flex items-center gap-6">
          <!-- User Info -->
          <div class="flex items-center gap-3">
            <Avatar :full-name="authStore.user!.fullName" size="md" />
            <div class="hidden sm:block">
              <p class="text-sm font-semibold text-gray-900">
                {{ authStore.user!.fullName }}
              </p>
              <div class="flex items-center gap-1.5 text-xs text-gray-500">
                <span v-if="authStore.isAdmin" class="font-medium text-primary-600">Admin</span>
                <span v-if="authStore.isAdmin" class="text-gray-300">•</span>
                <span>@{{ authStore.user!.username }}</span>
              </div>
            </div>
          </div>

          <!-- Action Icons -->
          <div class="flex items-center gap-2">
            <Button
              icon="pi pi-user"
              rounded
              text
              severity="secondary"
              aria-label="Profile"
              @click="$router.push('/profile')"
              class="hover:bg-gray-100"
            />

            <Button
              icon="pi pi-sign-out"
              rounded
              text
              severity="danger"
              aria-label="Logout"
              @click="handleLogout"
              :disabled="authStore.loading"
              :loading="authStore.loading"
              class="hover:bg-red-50"
            />
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Avatar from './Avatar.vue';
import Button from 'primevue/button';

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
