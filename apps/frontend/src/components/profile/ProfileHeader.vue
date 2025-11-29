<template>
  <div class="flex items-center space-x-4">
    <Avatar :full-name="fullName" size="lg" />
    <div>
      <h1 class="text-2xl font-bold text-gray-900">
        {{ fullName }}
      </h1>
      <p class="text-gray-500">@{{ username }}</p>
      <span
        v-if="isAdmin"
        class="inline-block mt-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded"
      >
        Admin
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import Avatar from '../Avatar.vue';

interface Props {
  fullName: string;
  username: string;
  isAdmin: boolean;
}

defineProps<Props>();
</script>
