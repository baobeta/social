<template>
  <div class="text-center py-16">
    <h2 class="text-5xl font-bold text-gray-800 mb-4">Ready to join?</h2>
    <p class="text-xl text-gray-600 mb-8">
      Join {{ activeUsers.toLocaleString() }}+ creators sharing ideas right now
    </p>
    <Button
      label="Create Your Account"
      @click="$emit('get-started')"
      class="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white border-0 px-10 py-4 text-lg font-semibold hover:shadow-2xl transition-shadow"
      rounded
    />
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button';

interface Props {
  activeUsers: number;
}

defineProps<Props>();

defineEmits<{
  'get-started': [];
}>();
</script>
