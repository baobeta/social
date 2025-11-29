<template>
  <div v-if="canEdit || canDelete" class="relative">
    <Button
      icon="pi pi-ellipsis-v"
      rounded
      text
      severity="secondary"
      size="small"
      @click="toggleMenu"
      :disabled="loading"
      class="hover:bg-gray-100"
      aria-label="Post actions"
    />
    <div
      v-if="menuVisible"
      class="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
    >
      <button
        v-if="canEdit"
        @click="handleEdit"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <i class="pi pi-pencil text-xs"></i>
        Edit
      </button>
      <button
        v-if="canDelete"
        @click="handleDelete"
        class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <i class="pi pi-trash text-xs"></i>
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useConfirm } from 'primevue/useconfirm';
import type { Post } from '@/types/post';
import Button from 'primevue/button';

interface Props {
  post: Post;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  edit: [post: Post];
  delete: [post: Post];
}>();

const authStore = useAuthStore();
const confirm = useConfirm();
const menuVisible = ref(false);

const canEdit = computed(() => {
  if (!authStore.user) return false;
  return (
    authStore.user.id === props.post.authorId ||
    authStore.isAdmin
  );
});

const canDelete = computed(() => {
  if (!authStore.user) return false;
  return (
    authStore.user.id === props.post.authorId ||
    authStore.isAdmin
  );
});

function toggleMenu() {
  menuVisible.value = !menuVisible.value;
}

function closeMenu() {
  menuVisible.value = false;
}

function handleEdit() {
  emit('edit', props.post);
  closeMenu();
}

function handleDelete() {
  closeMenu();
  confirm.require({
    message: 'Are you sure you want to delete this post?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: () => {
      emit('delete', props.post);
    }
  });
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (menuVisible.value && !target.closest('.relative')) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
