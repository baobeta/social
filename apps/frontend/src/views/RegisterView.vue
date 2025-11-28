<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p class="text-gray-600">Join our community today!</p>
      </div>

      <div class="bg-white rounded-lg shadow-xl p-8">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <Message v-if="authStore.error" severity="error" :closable="false">
            {{ authStore.error }}
          </Message>

          <div class="flex flex-col gap-2">
            <label for="fullName" class="font-medium text-gray-700">
              Full Name
            </label>
            <InputText
              id="fullName"
              v-model="formData.fullName"
              type="text"
              required
              placeholder="John Doe"
              class="w-full"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="username" class="font-medium text-gray-700">
              Username
            </label>
            <InputText
              id="username"
              v-model="formData.username"
              type="text"
              required
              placeholder="johndoe"
              class="w-full"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="font-medium text-gray-700">
              Password
            </label>
            <Password
              id="password"
              v-model="formData.password"
              required
              placeholder="Strong password required"
              :feedback="false"
              toggleMask
              class="w-full"
              inputClass="w-full"
            />
            <PasswordStrengthIndicator :password="formData.password" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="role" class="font-medium text-gray-700">
              Role
            </label>
            <Select
              id="role"
              v-model="formData.role"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a role"
              class="w-full"
            />
            <p class="text-xs text-gray-500">
              For demo purposes, you can choose your role
            </p>
          </div>

          <Button
            type="submit"
            :disabled="authStore.loading"
            :loading="authStore.loading"
            label="Create Account"
            class="w-full"
            severity="primary"
          />
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Already have an account?
            <RouterLink to="/login" class="font-medium text-blue-600 hover:text-blue-700">
              Sign in
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
import { UserRole, type RegisterData } from '@/types/auth';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator.vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Message from 'primevue/message';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref<RegisterData>({
  username: '',
  password: '',
  fullName: '',
  role: UserRole.USER,
});

const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
];

async function handleRegister() {
  try {
    await authStore.register(formData.value);
    router.push('/timeline');
  } catch (error) {
    // Error is handled in the store
  }
}
</script>
