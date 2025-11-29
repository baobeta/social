<template>
  <div class="border-t border-gray-100 px-card py-3 flex items-center justify-between">
    <button
      @click="emit('toggleComments')"
      class="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-500 transition-colors"
    >
      <i class="pi pi-comment"></i>
      <span class="font-medium">{{ commentsCount }}</span>
    </button>

    <button
      @click="emit('toggleComments')"
      :class="[
        'text-sm font-medium transition-colors',
        commentsExpanded ? 'text-gray-600 hover:text-gray-700' : 'text-primary-500 hover:text-primary-600'
      ]"
    >
      {{ commentsExpanded ? 'Hide comments' : 'Show comments' }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  commentsCount: number;
  commentsExpanded: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  toggleComments: [];
}>();
</script>
