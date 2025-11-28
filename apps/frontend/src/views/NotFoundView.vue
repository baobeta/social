<template>
  <div class="not-found-view">
    <h1 class="text-4xl font-bold text-center mt-16">404</h1>
    <p class="text-center mt-4 text-gray-600">Page not found</p>
    <div class="text-center mt-8">
      <router-link
        to="/"
        class="text-blue-600 hover:text-blue-800 underline"
      >
        Go back home
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 view logic
</script>

<style scoped>
.not-found-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
