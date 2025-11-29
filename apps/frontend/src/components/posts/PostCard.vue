<template>
  <div
    :class="[
      'bg-surface-card rounded-card border shadow-card hover:shadow-card-hover transition-shadow',
      post.isDeleted ? 'border-red-200 bg-red-50' : 'border-gray-100',
    ]"
  >
    <!-- Post Header -->
    <PostHeader :post="post">
      <template #actions>
        <PostActions
          :post="post"
          :loading="loading"
          @edit="(post) => emit('edit', post)"
          @delete="(post) => emit('delete', post)"
        />
      </template>
    </PostHeader>

    <!-- Post Content -->
    <PostContent :content="post.content" :is-deleted="post.isDeleted" />

    <!-- Social Actions Footer -->
    <PostFooter
      v-if="showComments"
      :comments-count="post.commentsCount || 0"
      :comments-expanded="commentsExpanded"
      @toggle-comments="toggleComments"
    />

    <!-- Comments Section -->
    <div v-if="showComments && commentsExpanded" class="border-t border-gray-100">
      <slot name="comments"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Post } from '@/types/post';
import PostHeader from './PostHeader.vue';
import PostContent from './PostContent.vue';
import PostActions from './PostActions.vue';
import PostFooter from './PostFooter.vue';

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
  toggleComments: [postId: string, expanded: boolean];
}>();

const commentsExpanded = ref(false);

function toggleComments() {
  commentsExpanded.value = !commentsExpanded.value;
  emit('toggleComments', props.post.id, commentsExpanded.value);
}
</script>
