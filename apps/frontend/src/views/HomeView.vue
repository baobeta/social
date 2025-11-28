<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-5xl font-bold text-gray-900 mb-2">Social</h1>
        <p class="text-xl text-gray-600">Connect, Share, Engage</p>
      </div>

      <div class="bg-white rounded-lg shadow-xl p-8 space-y-6">
        <div class="text-center">
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to Social
          </h2>
          <p class="text-gray-600">
            Join our community to share your thoughts and connect with others.
          </p>
        </div>

        <div class="space-y-3">
          <RouterLink
            to="/login"
            class="block w-full px-6 py-3 text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Sign In
          </RouterLink>

          <RouterLink
            to="/register"
            class="block w-full px-6 py-3 text-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors"
          >
            Create Account
          </RouterLink>
        </div>

        <div class="pt-6 border-t border-gray-200">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-blue-600">Share</div>
              <div class="text-xs text-gray-500 mt-1">Your thoughts</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-blue-600">Connect</div>
              <div class="text-xs text-gray-500 mt-1">With others</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-blue-600">Engage</div>
              <div class="text-xs text-gray-500 mt-1">In discussions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>
