<template>
  <form @submit.prevent="emit('submit')" class="space-y-6">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <div class="flex flex-col gap-2">
      <label for="username" class="font-medium text-gray-700">
        Username
      </label>
      <InputText
        id="username"
        v-model="username"
        type="text"
        required
        pattern="[a-zA-Z0-9_]+"
        placeholder="Enter your username"
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
        v-model="password"
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
      :disabled="loading"
      :loading="loading"
      label="Sign In"
      class="w-full"
      severity="primary"
    />
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';

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
