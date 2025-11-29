<template>
  <div>
    <!-- Comments list -->
    <div v-if="sortedComments.length > 0" class="space-y-3">
      <CommentItem
        v-for="comment in sortedComments"
        :key="comment.id"
        :comment="comment"
        @comment-updated="(comment) => emit('commentUpdated', comment)"
        @comment-deleted="(commentId) => emit('commentDeleted', commentId)"
      />

      <!-- Load more button -->
      <div v-if="hasMoreComments" class="flex justify-center pt-2">
        <Button
          label="Load more comments"
          size="small"
          text
          icon="pi pi-chevron-down"
          class="text-primary-500 hover:text-primary-600"
          @click="handleLoadMore"
          :loading="loadingMore"
          :disabled="loadingMore"
        />
      </div>
    </div>

    <!-- Empty state -->
    <p v-else class="text-sm text-gray-500 text-center py-6">
      No comments yet. Be the first to comment!
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Comment, PaginationMeta } from '@/types/post';
import CommentItem from './CommentItem.vue';
import Button from 'primevue/button';

interface Props {
  comments: Comment[];
  pagination?: PaginationMeta | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  commentUpdated: [comment: Comment];
  commentDeleted: [commentId: string];
  loadMore: [];
}>();

const loadingMore = ref(false);

const sortedComments = computed(() => {
  return [...props.comments].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

const hasMoreComments = computed(() => {
  if (!props.pagination) return false;
  const currentCount = props.pagination.offset + props.pagination.limit;
  return currentCount < props.pagination.total;
});

function handleLoadMore() {
  loadingMore.value = true;
  emit('loadMore');
  // Reset loading state after a short delay
  setTimeout(() => {
    loadingMore.value = false;
  }, 100);
}
</script>
