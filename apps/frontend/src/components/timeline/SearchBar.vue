<template>
  <div class="mb-8">
    <IconField iconPosition="left">
      <InputIcon class="pi pi-search" />
      <InputText
        :model-value="modelValue"
        @update:model-value="(value) => emit('update:modelValue', value as string)"
        @input="emit('search')"
        type="text"
        placeholder="Search posts by text or username..."
        class="w-full"
      />
    </IconField>
  </div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

interface Props {
  modelValue: string;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  search: [];
}>();
</script>
