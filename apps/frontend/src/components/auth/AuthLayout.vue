<template>
  <div class="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-100 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-gray-800 to-green-600 bg-clip-text text-transparent mb-2">{{ title }}</h1>
        <p class="text-gray-600">{{ subtitle }}</p>
      </div>

      <div class="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 p-8">
        <slot></slot>

        <div v-if="$slots.footer" class="mt-6 text-center">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  subtitle: string;
}

defineProps<Props>();
</script>
