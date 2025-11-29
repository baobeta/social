<template>
  <div class="px-card pb-card">
    <p class="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
      {{ content }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content: string;
}

defineProps<Props>();
</script>
