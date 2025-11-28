<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Sign In</h1>
        <p class="text-gray-600">Welcome back! Please sign in to your account.</p>
      </div>

      <div class="bg-white rounded-lg shadow-xl p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <Message v-if="authStore.error" severity="error" :closable="false">
            {{ authStore.error }}
          </Message>

          <div class="flex flex-col gap-2">
            <label for="username" class="font-medium text-gray-700">
              Username
            </label>
            <InputText
              id="username"
              v-model="credentials.username"
              type="text"
              required
              placeholder="Enter your username"
              class="w-full"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="font-medium text-gray-700">
              Password
            </label>
            <Password
              id="password"
              v-model="credentials.password"
              required
              placeholder="Enter your password"
              :feedback="false"
              toggleMask
              class="w-full"
              inputClass="w-full"
            />
          </div>

          <Button
            type="submit"
            :disabled="authStore.loading"
            :loading="authStore.loading"
            label="Sign In"
            class="w-full"
            severity="primary"
          />
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <RouterLink to="/register" class="font-medium text-blue-600 hover:text-blue-700">
              Sign up
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { LoginCredentials } from '@/types/auth';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';

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
