<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    header="Edit Post"
    :style="{ width: '32rem' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
  >
    <div class="flex flex-col gap-4">
      <Textarea
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        :autoResize="true"
        rows="4"
        class="w-full"
        :disabled="loading"
      />
    </div>
    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        @click="emit('cancel')"
        :disabled="loading"
      />
      <Button
        label="Save"
        severity="primary"
        @click="emit('save')"
        :disabled="!modelValue.trim() || loading"
        :loading="loading"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

interface Props {
  visible: boolean;
  modelValue: string;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'update:modelValue': [value: string];
  save: [];
  cancel: [];
}>();
</script>
