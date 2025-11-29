<template>
  <div class="px-card pb-card">
    <p
      :class="[
        'text-sm whitespace-pre-wrap leading-relaxed',
        isDeleted ? 'text-gray-400 line-through' : 'text-gray-900'
      ]"
    >
      {{ content }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content: string;
  isDeleted?: boolean;
}

withDefaults(defineProps<Props>(), {
  isDeleted: false
});
</script>
