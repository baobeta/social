<template>
  <form @submit.prevent="emit('submit')" class="space-y-5">
    <!-- Error Message with Icon -->
    <div
      v-if="error"
      class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
    >
      <i class="pi pi-exclamation-circle text-red-500 mt-0.5"></i>
      <span class="text-sm">{{ error }}</span>
    </div>

    <!-- Username Field -->
    <div class="space-y-2">
      <label for="username" class="block text-sm font-semibold text-gray-700">
        Username
      </label>
      <div class="relative">
        <i v-if="!username" class="pi pi-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <InputText
          id="username"
          v-model="username"
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
        Only letters, numbers, and underscores allowed
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
          v-model="password"
          required
          placeholder="Enter your password"
          :feedback="false"
          toggleMask
          class="w-full [&_input]:pl-11 [&_input]:pr-12 [&_input]:py-3 [&_input]:rounded-xl [&_input]:border-2 [&_input]:border-gray-200 [&_input:focus]:border-green-500 [&_input]:transition-colors"
          inputClass="w-full"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <Button
      type="submit"
      :disabled="loading"
      :loading="loading"
      class="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200"
    >
      <template v-if="!loading">
        <span class="flex items-center justify-center gap-2">
          <i class="pi pi-sign-in"></i>
          Sign In
        </span>
      </template>
      <template v-else>
        <span class="flex items-center justify-center gap-2">
          <i class="pi pi-spin pi-spinner"></i>
          Signing in...
        </span>
      </template>
    </Button>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';

interface Props {
  modelValue: {
    username: string;
    password: string;
  };
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: { username: string; password: string }];
  submit: [];
}>();

const usernameError = ref<string>('');

const username = computed({
  get: () => props.modelValue.username,
  set: (value) => {
    emit('update:modelValue', { ...props.modelValue, username: value });
    // Clear error when user types
    if (usernameError.value) {
      usernameError.value = '';
    }
  },
});

const password = computed({
  get: () => props.modelValue.password,
  set: (value) => emit('update:modelValue', { ...props.modelValue, password: value }),
});

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

  usernameError.value = '';
  return true;
}
</script>
