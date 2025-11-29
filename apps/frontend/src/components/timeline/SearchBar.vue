<template>
  <div class="mb-8">
    <IconField iconPosition="left" class="flex">
      <InputIcon class="pi pi-search" />
      <InputText
        data-ci="search-input"
        :model-value="modelValue"
        @update:model-value="(value) => emit('update:modelValue', value as string)"
        type="text"
        placeholder="Search posts by text or username..."
        class="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
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
}>();
</script>
