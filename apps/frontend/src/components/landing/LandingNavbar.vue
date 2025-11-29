<template>
  <nav class="relative z-10 flex items-center justify-between px-8 py-6">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
          <path d="M5 19l1 3 3-1-1-3-3 1z"/>
          <path d="M19 19l-1 3-3-1 1-3 3 1z"/>
        </svg>
      </div>
      <span class="text-xl font-bold text-gray-800">Social</span>
    </div>

    <div class="flex items-center gap-6">
      <span class="text-sm text-gray-600 flex items-center gap-2">
        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        {{ activeUsers.toLocaleString() }} online
      </span>

      <Button
        v-if="!isAuthenticated"
        label="Sign In"
        @click="$emit('sign-in')"
        rounded
        class="bg-white border-2 border-green-500 text-green-700 hover:bg-green-50"
      />

      <Button
        v-else
        label="Sign Out"
        @click="$emit('sign-out')"
        rounded
        severity="secondary"
        outlined
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import Button from 'primevue/button';

interface Props {
  activeUsers: number;
  isAuthenticated: boolean;
}

defineProps<Props>();

defineEmits<{
  'sign-in': [];
  'sign-out': [];
}>();
</script>
