<template>
  <div
    class="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:border-green-300 transition-all cursor-pointer group"
    @mouseenter="$emit('hover', true)"
    @mouseleave="$emit('hover', false)"
  >
    <div
      class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all"
      :class="isHovered ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-gray-100 text-gray-600'"
    >
      <i :class="icon" class="text-xl"></i>
    </div>
    <h3 class="text-xl font-semibold text-gray-800 mb-2">{{ title }}</h3>
    <p class="text-gray-600">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string;
  title: string;
  description: string;
  isHovered: boolean;
}

defineProps<Props>();

defineEmits<{
  hover: [isHovered: boolean];
}>();
</script>
