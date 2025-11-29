<template>
  <div>
    <!-- Cursor Glow Effect -->
    <div
      class="fixed w-96 h-96 rounded-full pointer-events-none transition-all duration-300 blur-3xl opacity-30"
      :style="{
        left: `${192}px`,
        top: `${192}px`,
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)'
      }"
    ></div>

    <!-- Floating Particles -->
    <div class="fixed inset-0 pointer-events-none">
      <div
        v-for="i in 20"
        :key="i"
        class="absolute w-1 h-1 bg-green-400 rounded-full opacity-40 animate-float"
        :style="{
          left: `${particlePositions[i - 1]?.x}%`,
          top: `${particlePositions[i - 1]?.y}%`,
          animationDuration: `${3 + Math.random() * 4}s`,
          animationDelay: `${Math.random() * 2}s`
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">

interface Props {
  mousePos: { x: number; y: number };
}

defineProps<Props>();

const particlePositions = Array.from({ length: 20 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100
}));
</script>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
  50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}
</style>
