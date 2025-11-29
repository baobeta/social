<template>
  <div class="flex items-center gap-2">
    <Button
      icon="pi pi-user"
      rounded
      text
      severity="secondary"
      size="small"
      @click="emit('profile')"
      class="hover:bg-gray-100"
      aria-label="View profile"
    />
    <Button
      icon="pi pi-sign-out"
      rounded
      text
      severity="secondary"
      size="small"
      @click="handleLogout"
      :loading="loading"
      class="hover:bg-gray-100"
      aria-label="Logout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';

const emit = defineEmits<{
  profile: [];
  logout: [];
}>();

const loading = ref(false);

function handleLogout() {
  loading.value = true;
  emit('logout');
}
</script>
