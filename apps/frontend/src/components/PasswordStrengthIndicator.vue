<template>
  <div v-if="password" class="mt-2 space-y-2">
    <!-- Progress bar -->
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div
        :class="[progressColor, 'h-2 rounded-full transition-all duration-300']"
        :style="{ width: `${progressPercent}%` }"
      ></div>
    </div>

    <!-- Strength label -->
    <div class="flex items-center justify-between text-sm">
      <span :class="strength.color" class="font-medium">
        Password strength: {{ strength.label }}
      </span>
      <span class="text-gray-500">{{ Math.round(progressPercent) }}%</span>
    </div>

    <!-- Error messages -->
    <ul v-if="strength.errors.length > 0" class="text-xs text-gray-600 space-y-1" 
      data-ci="register-error-message-password-strength"
    >
      <li v-for="(error, index) in strength.errors" :key="index" class="flex items-start">
        <svg class="w-3 h-3 mr-1 mt-0.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <span>{{ error }}</span>
      </li>
    </ul>

    <!-- Success message -->
    <div v-else class="flex items-center text-xs text-green-600">
      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clip-rule="evenodd"
        />
      </svg>
      <span>Password meets all requirements</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import { usePasswordStrength } from '@/composables/usePasswordStrength';

interface Props {
  password: string;
}

const props = defineProps<Props>();
const passwordRef = toRef(props, 'password');

const { strength, progressPercent, progressColor } = usePasswordStrength(passwordRef);
</script>
