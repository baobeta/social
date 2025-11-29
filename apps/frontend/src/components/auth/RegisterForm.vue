<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <div class="flex flex-col gap-2">
      <label for="fullName" class="font-medium text-gray-700">
        Full Name
      </label>
      <InputText
        id="fullName"
        :model-value="modelValue.fullName"
        @update:model-value="updateField('fullName', $event)"
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
        :model-value="modelValue.username"
        @update:model-value="updateField('username', $event)"
        type="text"
        required
        pattern="[a-zA-Z0-9_]+"
        placeholder="johndoe"
        class="w-full"
        :class="{ 'p-invalid': usernameError }"
        @blur="validateUsername"
      />
      <small v-if="usernameError" class="text-red-600">{{ usernameError }}</small>
      <small v-else class="text-gray-500">Only letters, numbers, and underscores allowed</small>
    </div>

    <div class="flex flex-col gap-2">
      <label for="password" class="font-medium text-gray-700">
        Password
      </label>
      <Password
        id="password"
        :model-value="modelValue.password"
        @update:model-value="updateField('password', $event)"
        required
        placeholder="Strong password required"
        :feedback="false"
        toggleMask
        class="w-full"
        inputClass="w-full"
      />
      <PasswordStrengthIndicator :password="modelValue.password" />
    </div>

    <div class="flex flex-col gap-2">
      <label for="confirmPassword" class="font-medium text-gray-700">
        Confirm Password
      </label>
      <Password
        id="confirmPassword"
        :model-value="confirmPassword"
        @update:model-value="emit('update:confirmPassword', $event)"
        required
        placeholder="Re-enter your password"
        :feedback="false"
        toggleMask
        class="w-full"
        inputClass="w-full"
      />
      <Message
        v-if="confirmPassword && confirmPassword !== modelValue.password"
        severity="error"
        :closable="false"
      >
        Passwords do not match
      </Message>
    </div>

    <div class="flex flex-col gap-2">
      <label for="role" class="font-medium text-gray-700">
        Role
      </label>
      <Select
        id="role"
        :model-value="modelValue.role"
        @update:model-value="updateField('role', $event)"
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
      :disabled="loading || !isValid"
      :loading="loading"
      label="Create Account"
      class="w-full"
      severity="primary"
    />
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
import Message from 'primevue/message';

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
