<template>
  <div
    :class="[
      'inline-flex items-center justify-center rounded-full font-semibold text-white',
      sizeClasses,
      bgColor,
    ]"
    :title="fullName"
  >
    {{ initials }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  fullName: string;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const initials = computed(() => {
  return props.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };
  return sizes[props.size];
});

const bgColor = computed(() => {
  // Generate consistent color based on name
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
  ];
  const index = props.fullName.charCodeAt(0) % colors.length;
  return colors[index];
});
</script>
