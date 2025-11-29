<template>
  <AuthLayout
    title="Sign In"
    subtitle="Welcome back! Please sign in to your account."
  >
    <LoginForm
      v-model="credentials"
      :loading="authStore.loading"
      :error="authStore.error"
      @submit="handleLogin"
    />

    <template #footer>
      <p class="text-sm text-gray-600">
        Don't have an account?
        <RouterLink to="/register" class="font-medium text-blue-600 hover:text-blue-700">
          Sign up
        </RouterLink>
      </p>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { LoginCredentials } from '@/types/auth';
import AuthLayout from '@/components/auth/AuthLayout.vue';
import LoginForm from '@/components/auth/LoginForm.vue';

const router = useRouter();
const authStore = useAuthStore();

const credentials = ref<LoginCredentials>({
  username: '',
  password: '',
});

async function handleLogin() {
  try {
    await authStore.login(credentials.value);
    router.push('/timeline');
  } catch (error) {
    // Error is handled in the store
  }
}
</script>
