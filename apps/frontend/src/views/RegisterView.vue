<template>
  <AuthLayout
    title="Create Account"
    subtitle="Join our community today!"
  >
    <RegisterForm
      v-model="formData"
      v-model:confirm-password="confirmPassword"
      :loading="authStore.loading"
      :error="authStore.error"
      @submit="handleRegister"
    />

    <template #footer>
      <p class="text-sm text-gray-600">
        Already have an account?
        <RouterLink to="/login" class="font-medium text-blue-600 hover:text-blue-700">
          Sign in
        </RouterLink>
      </p>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { UserRole, type RegisterData } from '@/types/auth';
import AuthLayout from '@/components/auth/AuthLayout.vue';
import RegisterForm from '@/components/auth/RegisterForm.vue';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref<RegisterData>({
  username: '',
  password: '',
  fullName: '',
  role: UserRole.USER,
});

const confirmPassword = ref('');

async function handleRegister() {
  // Validate password confirmation
  if (formData.value.password !== confirmPassword.value) {
    authStore.error = 'Passwords do not match';
    return;
  }

  try {
    await authStore.register(formData.value);
    router.push('/timeline');
  } catch (error) {
    // Error is handled in the store
  }
}
</script>
