<template>
  <div v-if="canEdit || canDelete" class="flex items-center gap-1">
    <Button
      v-if="canEdit"
      data-ci="post-edit-button"
      icon="pi pi-pencil"
      rounded
      text
      size="small"
      severity="secondary"
      @click="handleEdit"
      :disabled="loading"
      class="hover:bg-gray-100"
      :class="{
      'bg-slate-400': loading,
      }"
      aria-label="Edit post"
    />
    <Button
      v-if="canDelete"
      data-ci="post-delete-button"
      icon="pi pi-trash"
      rounded
      text
      size="small"
      severity="danger"
      @click="handleDelete"
      :disabled="loading"
      class="hover:bg-red-50"
      :class="{
      'bg-slate-400': loading,
      }"
      aria-label="Delete post"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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

const canEdit = computed(() => {
  if (!authStore.user) return false;
  // Cannot edit deleted posts
  if (props.post.isDeleted) return false;
  return (
    authStore.user.id === props.post.author.id ||
    authStore.isAdmin
  );
});

const canDelete = computed(() => {
  if (!authStore.user) return false;
  // Cannot delete already deleted posts
  if (props.post.isDeleted) return false;
  return (
    authStore.user.id === props.post.author.id ||
    authStore.isAdmin
  );
});

function handleEdit() {
  emit('edit', props.post);
}

function handleDelete() {
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
</script>
