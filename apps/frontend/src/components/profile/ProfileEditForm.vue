<template>
  <div class="border-t border-gray-200 pt-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h2>

    <form @submit.prevent="emit('submit')" class="space-y-4">
      <Message v-if="error" severity="error" :closable="true" @close="emit('clearError')">
        {{ error }}
      </Message>

      <Message v-if="successMessage" severity="success" :closable="true" @close="emit('clearSuccess')">
        {{ successMessage }}
      </Message>

      <div class="flex flex-col gap-2">
        <label for="fullName" class="font-medium text-gray-700">
          Full Name
        </label>
        <InputText
          id="fullName"
          data-ci="profile-fullname-input"
          :model-value="fullName"
          @update:model-value="emit('update:fullName', $event)"
          type="text"
          required
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-medium text-gray-700">
          Username
        </label>
        <InputText
          :value="username"
          type="text"
          disabled
          class="w-full"
        />
        <p class="text-xs text-gray-500">Username cannot be changed</p>
      </div>

      <div class="flex justify-end gap-3">
        <Button
          data-ci="profile-cancel-button"
          label="Cancel"
          severity="secondary"
          @click="emit('cancel')"
          type="button"
        />
        <Button
          data-ci="profile-save-button"
          type="submit"
          label="Save Changes"
          severity="primary"
          :disabled="loading || !hasChanges"
          :loading="loading"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';

interface Props {
  fullName: string;
  username: string;
  loading?: boolean;
  hasChanges?: boolean;
  error?: string | null;
  successMessage?: string | null;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  hasChanges: false,
  error: null,
  successMessage: null,
});

const emit = defineEmits<{
  'update:fullName': [value: string];
  submit: [];
  cancel: [];
  clearError: [];
  clearSuccess: [];
}>();
</script>
