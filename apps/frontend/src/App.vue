<template>
  <div id="app">
    <!-- Show loading spinner while checking authentication -->
    <div v-if="isInitializing" class="flex items-center justify-center min-h-screen">
      <ProgressSpinner />
    </div>

    <!-- Show app content once auth check is complete -->
    <RouterView v-else />

    <!-- Global ConfirmDialog for confirmation popups -->
    <ConfirmDialog
      :pt="{
        acceptButton: () => ({ 'data-ci': 'confirm-dialog-confirm-button' }),
        rejectButton: () => ({ 'data-ci': 'confirm-dialog-cancel-button' })
      }"
    />

    <!-- Global Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { hasToken } from '@/lib/token';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';

const authStore = useAuthStore();
const isInitializing = ref(true);

onBeforeMount(async () => {
  // Only try to restore session if we have a token
  if (hasToken() && !authStore.user) {
    try {
      await authStore.fetchCurrentUser();
    } catch (error) {
      // Token invalid or expired - will be handled by router
    }
  }

  // Done initializing
  isInitializing.value = false;
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>
