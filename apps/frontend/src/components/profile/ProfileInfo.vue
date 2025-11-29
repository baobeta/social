<template>
  <div class="border-t border-gray-200 mt-6 pt-6">
    <h3 class="text-sm font-medium text-gray-500 mb-2">Account Information</h3>
    <dl class="space-y-2">
      <div v-if="createdAt" class="flex justify-between text-sm">
        <dt class="text-gray-500">Member since</dt>
        <dd class="text-gray-900">{{ formatDate(createdAt) }}</dd>
      </div>
      <div class="flex justify-between text-sm">
        <dt class="text-gray-500">Role</dt>
        <dd class="text-gray-900 capitalize">{{ role }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
interface Props {
  createdAt?: string;
  role: string;
}

defineProps<Props>();

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>
