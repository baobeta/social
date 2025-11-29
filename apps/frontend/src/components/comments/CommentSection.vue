<template>
  <div class="p-card space-y-4">
    <!-- Add comment form -->
    <CommentForm
      :post-id="postId"
      @comment-created="(comment) => emit('commentCreated', comment)"
    />

    <!-- Comments list -->
    <CommentList
      :comments="comments"
      :pagination="pagination"
      @comment-updated="(comment) => emit('commentUpdated', comment)"
      @comment-deleted="(commentId) => emit('commentDeleted', commentId)"
      @load-more="emit('loadMore')"
    />
  </div>
</template>

<script setup lang="ts">
import type { Comment, PaginationMeta } from '@/types/post';
import CommentForm from './CommentForm.vue';
import CommentList from './CommentList.vue';

interface Props {
  postId: string;
  comments: Comment[];
  pagination?: PaginationMeta | null;
}

defineProps<Props>();

const emit = defineEmits<{
  commentCreated: [comment: Comment];
  commentUpdated: [comment: Comment];
  commentDeleted: [commentId: string];
  loadMore: [];
}>();
</script>
