<template>
  <div class="flex items-start gap-3 p-card">
    <Avatar :full-name="post.author.fullName" size="sm" />

    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-gray-900">
              {{ post.author.fullName }}
            </p>
            <span v-if="post.author.role === 'admin'" class="text-xs font-medium text-primary-600">
              Admin
            </span>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span>@{{ post.author.username }}</span>
            <span class="text-gray-300">•</span>
            <span>{{ formatDate(post.createdAt) }}</span>
            <span v-if="post.editedByAdmin" class="text-purple-600">
              • Edited by admin
            </span>
            <span v-else-if="post.isEdited" class="text-gray-500">
              • Edited
            </span>
          </div>
        </div>

        <slot name="actions"></slot>
      </div>

      <Tag
        v-if="post.isDeleted"
        value="Deleted"
        severity="danger"
        class="mt-2"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '@/types/post';
import Avatar from '../Avatar.vue';
import Tag from 'primevue/tag';

interface Props {
  post: Post;
}

defineProps<Props>();

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
