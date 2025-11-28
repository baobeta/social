<template>
  <div
    :class="[
      'bg-white rounded-lg border p-4',
      post.isDeleted ? 'border-red-200 bg-red-50' : 'border-gray-200',
    ]"
  >
    <div class="flex space-x-3">
      <Avatar :full-name="post.author.fullName" size="md" />

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-gray-900">
              {{ post.author.fullName }}
            </p>
            <p class="text-sm text-gray-500">@{{ post.author.username }}</p>
            <Tag
              v-if="post.author.role === 'admin'"
              value="Admin"
              severity="secondary"
            />
            <Tag
              v-if="post.isDeleted"
              value="Deleted"
              severity="danger"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button
              v-if="canEdit"
              label="Edit"
              size="small"
              text
              severity="primary"
              @click="$emit('edit', post)"
              :disabled="loading"
            />
            <Button
              v-if="canDelete"
              label="Delete"
              size="small"
              text
              severity="danger"
              @click="handleDelete"
              :disabled="loading"
            />
          </div>
        </div>

        <p class="mt-2 text-sm text-gray-900 whitespace-pre-wrap">
          {{ post.content }}
        </p>

        <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
          <span>{{ formatDate(post.createdAt) }}</span>
          <span v-if="post.updatedAt !== post.createdAt" class="flex items-center space-x-1">
            <span>•</span>
            <span v-if="post.editedByAdmin" class="text-purple-600">
              Edited by admin
            </span>
            <span v-else>Edited</span>
          </span>
        </div>

        <div v-if="showComments" class="mt-4">
          <Button
            :label="`${commentsExpanded ? 'Hide' : 'Show'} comments${post.commentsCount ? ` (${post.commentsCount})` : ''}`"
            size="small"
            text
            icon="pi pi-comment"
            @click="toggleComments"
          />

          <div v-if="commentsExpanded" class="mt-3">
            <slot name="comments"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useConfirm } from 'primevue/useconfirm';
import type { Post } from '@/types/post';
import Avatar from './Avatar.vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

interface Props {
  post: Post;
  loading?: boolean;
  showComments?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showComments: true,
});

const emit = defineEmits<{
  edit: [post: Post];
  delete: [post: Post];
}>();

const authStore = useAuthStore();
const confirm = useConfirm();
const commentsExpanded = ref(false);

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

function toggleComments() {
  commentsExpanded.value = !commentsExpanded.value;
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
}
</script>
