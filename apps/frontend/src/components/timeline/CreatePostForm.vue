<template>
  <div class="bg-surface-card rounded-card border border-gray-100 p-6 mb-8 shadow-card hover:shadow-card-hover transition-shadow">
    <form @submit.prevent="emit('submit')" class="flex flex-col gap-4">
      <Textarea
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        placeholder="What's on your mind?"
        :autoResize="true"
        rows="3"
        class="w-full border-gray-200 focus:border-primary-400 focus:ring-primary-400 rounded-lg"
        :disabled="loading"
      />
      <div class="flex justify-end">
        <Button
          type="submit"
          :disabled="!modelValue.trim() || loading"
          :loading="loading"
          label="Post"
          class="bg-primary-500 hover:bg-primary-600 border-primary-500 hover:border-primary-600 px-6 py-2.5 rounded-button font-medium transition-colors"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

interface Props {
  modelValue: string;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  submit: [];
}>();
</script>
