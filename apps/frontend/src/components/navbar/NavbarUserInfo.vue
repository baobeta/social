<template>
  <div class="flex items-center gap-3">
    <Avatar :full-name="fullName" size="md" />
    <div class="hidden sm:block">
      <p data-ci="user-display-name" class="text-sm font-medium text-gray-900">
        {{ fullName }}
      </p>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span v-if="isAdmin" class="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">
          Admin
        </span>
        <span class="text-gray-600">@{{ username }}</span>
      </div>
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
