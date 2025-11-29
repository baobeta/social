<template>
  <div class="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6 mb-8 shadow-lg hover:shadow-xl transition-all">
    <form @submit.prevent="emit('submit')" class="flex flex-col gap-4">
      <Textarea
        data-ci="post-create-textarea"
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        placeholder="What's on your mind?"
        :autoResize="true"
        rows="3"
        class="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-0 rounded-xl transition-colors"
        :disabled="loading"
      />
      <div class="flex justify-end">
        <Button
          data-ci="post-create-submit-button"
          type="submit"
          :disabled="!modelValue.trim() || loading"
          :loading="loading"
          class="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <template v-if="!loading">
            <span class="flex items-center justify-center gap-2">
              <i class="pi pi-send"></i>
              Post
            </span>
          </template>
          <template v-else>
            <span class="flex items-center justify-center gap-2">
              <i class="pi pi-spin pi-spinner"></i>
              Posting...
            </span>
          </template>
        </Button>
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
