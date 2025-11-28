<template>
  <nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <RouterLink to="/timeline" class="text-xl font-bold text-gray-900">
            Social
          </RouterLink>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <Avatar :full-name="authStore.user!.fullName" size="sm" />
            <div class="hidden sm:block">
              <p class="text-sm font-medium text-gray-900">
                {{ authStore.user!.fullName }}
              </p>
              <div class="flex items-center gap-1 text-xs text-gray-500">
                <span>@{{ authStore.user!.username }}</span>
                <Tag
                  v-if="authStore.isAdmin"
                  value="Admin"
                  severity="secondary"
                  size="small"
                />
              </div>
            </div>
          </div>

          <Button
            label="Profile"
            size="small"
            text
            icon="pi pi-user"
            @click="$router.push('/profile')"
          />

          <Button
            label="Logout"
            size="small"
            severity="danger"
            text
            icon="pi pi-sign-out"
            @click="handleLogout"
            :disabled="authStore.loading"
            :loading="authStore.loading"
          />
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
import Tag from 'primevue/tag';

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
