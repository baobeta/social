<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Error Message with Icon -->
    <div
      v-if="error"
      class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
    >
      <i class="pi pi-exclamation-circle text-red-500 mt-0.5"></i>
      <span class="text-sm">{{ error }}</span>
    </div>

    <!-- Full Name Field -->
    <div class="space-y-2">
      <label for="fullName" class="block text-sm font-semibold text-gray-700">
        Full Name
      </label>
      <div class="relative">
        <i v-if="!modelValue.fullName" class="pi pi-id-card absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <InputText
          id="fullName"
          :model-value="modelValue.fullName"
          @update:model-value="updateField('fullName', $event)"
          type="text"
          required
          placeholder="        Enter your full name"
          class="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors"
        />
      </div>
    </div>

    <!-- Username Field -->
    <div class="space-y-2">
      <label for="username" class="block text-sm font-semibold text-gray-700">
        Username
      </label>
      <div class="relative">
        <i v-if="!modelValue.username" class="pi pi-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <InputText
          id="username"
          :model-value="modelValue.username"
          @update:model-value="updateField('username', $event)"
          type="text"
          required
          pattern="[a-zA-Z0-9_]+"
          placeholder="        Enter your username"
          class="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors"
          :class="{ 'border-red-400 focus:border-red-500': usernameError }"
          @blur="validateUsername"
        />
      </div>
      <small v-if="usernameError" class="flex items-center gap-1 text-red-600">
        <i class="pi pi-times-circle text-xs"></i>
        {{ usernameError }}
      </small>
      <small v-else class="flex items-center gap-1 text-gray-500">
        <i class="pi pi-info-circle text-xs"></i>
        Only letters, numbers, and underscores (min 3 characters)
      </small>
    </div>

    <!-- Password Field -->
    <div class="space-y-2">
      <label for="password" class="block text-sm font-semibold text-gray-700">
        Password
      </label>
      <div class="relative">
        <i class="pi pi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
        <Password
          id="password"
          :model-value="modelValue.password"
          @update:model-value="updateField('password', $event)"
          required
          placeholder="Create a strong password"
          :feedback="false"
          toggleMask
          class="w-full [&_input]:pl-11 [&_input]:pr-12 [&_input]:py-3 [&_input]:rounded-xl [&_input]:border-2 [&_input]:border-gray-200 [&_input:focus]:border-green-500 [&_input]:transition-colors"
          inputClass="w-full"
        />
      </div>
      <PasswordStrengthIndicator :password="modelValue.password" />
    </div>

    <!-- Confirm Password Field -->
    <div class="space-y-2">
      <label for="confirmPassword" class="block text-sm font-semibold text-gray-700">
        Confirm Password
      </label>
      <div class="relative">
        <i class="pi pi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
        <Password
          id="confirmPassword"
          :model-value="confirmPassword"
          @update:model-value="emit('update:confirmPassword', $event)"
          required
          placeholder="Re-enter your password"
          :feedback="false"
          toggleMask
          class="w-full [&_input]:pl-11 [&_input]:pr-12 [&_input]:py-3 [&_input]:rounded-xl [&_input]:border-2 [&_input]:border-gray-200 [&_input:focus]:border-green-500 [&_input]:transition-colors"
          :class="{ '[&_input]:border-red-400 [&_input:focus]:border-red-500': confirmPassword && confirmPassword !== modelValue.password }"
          inputClass="w-full"
        />
      </div>
      <small
        v-if="confirmPassword && confirmPassword !== modelValue.password"
        class="flex items-center gap-1 text-red-600"
      >
        <i class="pi pi-times-circle text-xs"></i>
        Passwords do not match
      </small>
    </div>

    <!-- Role Field -->
    <div class="space-y-2">
      <label for="role" class="block text-sm font-semibold text-gray-700">
        Role
      </label>
      <div class="relative">
        <Select
          id="role"
          :model-value="modelValue.role"
          @update:model-value="updateField('role', $event)"
          :options="roleOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select a role"
          class="w-full [&_button]:pl-11 [&_button]:pr-4 [&_button]:py-3 [&_button]:rounded-xl [&_button]:border-2 [&_button]:border-gray-200 [&_button:focus]:border-green-500 [&_button]:transition-colors"
        >
      </Select>
      </div>
      <small class="flex items-center gap-1 text-gray-500">
        <i class="pi pi-info-circle text-xs"></i>
        For demo purposes, you can choose your role
      </small>
    </div>

    <!-- Submit Button -->
    <Button
      type="submit"
      :disabled="loading || !isValid"
      :loading="loading"
      class="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200"
    >
      <template v-if="!loading">
        <span class="flex items-center justify-center gap-2">
          <i class="pi pi-user-plus"></i>
          Create Account
        </span>
      </template>
      <template v-else>
        <span class="flex items-center justify-center gap-2">
          <i class="pi pi-spin pi-spinner"></i>
          Creating account...
        </span>
      </template>
    </Button>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RegisterData } from '@/types/auth';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator.vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Select from 'primevue/select';
import Button from 'primevue/button';

interface Props {
  modelValue: RegisterData;
  confirmPassword: string;
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: RegisterData];
  'update:confirmPassword': [value: string];
  submit: [];
}>();

const usernameError = ref<string>('');

const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
];

const isValid = computed(() => {
  return (
    props.modelValue.fullName &&
    props.modelValue.username &&
    props.modelValue.password &&
    props.confirmPassword &&
    props.modelValue.password === props.confirmPassword &&
    !usernameError.value
  );
});

function updateField(field: keyof RegisterData, value: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });

  // Clear username error when user types
  if (field === 'username' && usernameError.value) {
    usernameError.value = '';
  }
}

function validateUsername() {
  const usernamePattern = /^[a-zA-Z0-9_]+$/;

  if (!props.modelValue.username) {
    usernameError.value = 'Username is required';
    return false;
  }

  if (!usernamePattern.test(props.modelValue.username)) {
    usernameError.value = 'Username can only contain letters, numbers, and underscores';
    return false;
  }

  if (props.modelValue.username.length < 3) {
    usernameError.value = 'Username must be at least 3 characters';
    return false;
  }

  usernameError.value = '';
  return true;
}

function handleSubmit() {
  // Validate username before submission
  const isUsernameValid = validateUsername();

  if (isValid.value && isUsernameValid) {
    emit('submit');
  }
}
</script>
