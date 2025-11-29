<template>
  <div class="p-card space-y-4">
    <!-- Add comment form -->
    <form @submit.prevent="handleSubmit" class="flex gap-3">
      <Avatar :full-name="authStore.user!.fullName" size="sm" />
      <div class="flex-1 flex flex-col gap-3">
        <Textarea
          v-model="newComment"
          placeholder="Write a comment..."
          :autoResize="true"
          rows="2"
          class="w-full text-sm border-gray-200 focus:border-primary-400 focus:ring-primary-400 rounded-lg"
          :disabled="loading"
        />
        <div class="flex justify-end">
          <Button
            type="submit"
            label="Comment"
            size="small"
            class="bg-primary-500 hover:bg-primary-600 border-primary-500 hover:border-primary-600 px-4 py-2 rounded-button font-medium transition-colors"
            :disabled="!newComment.trim() || loading"
            :loading="loading"
          />
        </div>
      </div>
    </form>

    <!-- Comments list -->
    <div v-if="localComments.length > 0" class="space-y-3 pt-2">
      <div
        v-for="comment in localComments"
        :key="comment.id"
        :class="[
          'flex gap-3 p-3 rounded-lg border',
          comment.isDeleted ? 'bg-red-50 border-red-200' : 'bg-surface border-gray-100',
        ]"
      >
        <Avatar :full-name="comment.author.fullName" size="sm" />

        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-gray-900">
                  {{ comment.author.fullName }}
                </p>
                <span v-if="comment.author.role === 'admin'" class="text-xs font-medium text-primary-600">
                  Admin
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span>@{{ comment.author.username }}</span>
                <span class="text-gray-300">•</span>
                <span>{{ formatDate(comment.createdAt) }}</span>
                <span v-if="comment.updatedAt !== comment.createdAt && comment.editedByAdmin" class="text-purple-600">
                  • Edited by admin
                </span>
                <span v-else-if="comment.updatedAt !== comment.createdAt">
                  • Edited
                </span>
              </div>
            </div>

            <div v-if="canEdit(comment) || canDelete(comment)" class="flex-shrink-0">
              <div class="flex items-center gap-1">
                <Button
                  v-if="canEdit(comment)"
                  icon="pi pi-pencil"
                  rounded
                  text
                  size="small"
                  severity="secondary"
                  @click="startEdit(comment)"
                  :disabled="deletingIds.has(comment.id)"
                  class="hover:bg-gray-100"
                  aria-label="Edit comment"
                />
                <Button
                  v-if="canDelete(comment)"
                  icon="pi pi-trash"
                  rounded
                  text
                  size="small"
                  severity="danger"
                  @click="handleDelete(comment.id)"
                  :disabled="deletingIds.has(comment.id)"
                  :loading="deletingIds.has(comment.id)"
                  class="hover:bg-red-50"
                  aria-label="Delete comment"
                />
              </div>
            </div>
          </div>

          <Tag
            v-if="comment.isDeleted"
            value="Deleted"
            severity="danger"
            size="small"
            class="mt-2"
          />

          <!-- Edit mode -->
          <div v-if="editingId === comment.id" class="mt-3 flex flex-col gap-3">
            <Textarea
              v-model="editContent"
              :autoResize="true"
              rows="2"
              class="w-full text-sm border-gray-200 focus:border-primary-400 focus:ring-primary-400 rounded-lg"
              :disabled="editLoading"
            />
            <div class="flex justify-end gap-2">
              <Button
                label="Cancel"
                size="small"
                severity="secondary"
                @click="cancelEdit"
                :disabled="editLoading"
                class="rounded-button"
              />
              <Button
                label="Save"
                size="small"
                class="bg-primary-500 hover:bg-primary-600 border-primary-500 hover:border-primary-600 rounded-button font-medium transition-colors"
                @click="saveEdit(comment.id)"
                :disabled="!editContent.trim() || editLoading"
                :loading="editLoading"
              />
            </div>
          </div>

          <!-- Display mode -->
          <p v-else class="mt-2 text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
            {{ comment.content }}
          </p>
        </div>
      </div>

      <!-- Load more button -->
      <div v-if="hasMoreComments" class="flex justify-center pt-2">
        <Button
          label="Load more comments"
          size="small"
          text
          icon="pi pi-chevron-down"
          class="text-primary-500 hover:text-primary-600"
          @click="loadMoreComments"
          :loading="loadingMore"
          :disabled="loadingMore"
        />
      </div>
    </div>

    <p v-else class="text-sm text-gray-500 text-center py-6">
      No comments yet. Be the first to comment!
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useConfirm } from 'primevue/useconfirm';
import type { Comment, PaginationMeta } from '@/types/post';
import * as commentsService from '@/services/comments.ajax';
import Avatar from './Avatar.vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

interface Props {
  postId: string;
  comments: Comment[];
  pagination?: PaginationMeta | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  commentCreated: [comment: Comment];
  commentUpdated: [comment: Comment];
  commentDeleted: [commentId: string];
  loadMore: [];
}>();

const authStore = useAuthStore();
const confirm = useConfirm();
const newComment = ref('');
const loading = ref(false);
const editingId = ref<string | null>(null);
const editContent = ref('');
const editLoading = ref(false);
const deletingIds = ref(new Set<string>());
const loadingMore = ref(false);

const localComments = computed(() => {
  return props.comments.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

const hasMoreComments = computed(() => {
  if (!props.pagination) return false;
  const currentCount = props.pagination.offset + props.pagination.limit;
  return currentCount < props.pagination.total;
});

function canEdit(comment: Comment): boolean {
  if (!authStore.user) return false;
  return (
    authStore.user.id === comment.authorId ||
    authStore.isAdmin
  );
}

function canDelete(comment: Comment): boolean {
  if (!authStore.user) return false;
  return (
    authStore.user.id === comment.authorId ||
    authStore.isAdmin
  );
}

async function handleSubmit() {
  if (!newComment.value.trim()) return;

  loading.value = true;
  try {
    const response = await commentsService.createComment({
      postId: props.postId,
      content: newComment.value,
    });
    newComment.value = '';
    emit('commentCreated', response.data.comment);
  } catch (error) {
    console.error('Failed to create comment:', error);
    alert('Failed to create comment. Please try again.');
  } finally {
    loading.value = false;
  }
}

function startEdit(comment: Comment) {
  editingId.value = comment.id;
  editContent.value = comment.content;
}

function cancelEdit() {
  editingId.value = null;
  editContent.value = '';
}

async function saveEdit(commentId: string) {
  if (!editContent.value.trim()) return;

  editLoading.value = true;
  try {
    const response = await commentsService.updateComment(commentId, {
      content: editContent.value,
    });
    editingId.value = null;
    editContent.value = '';
    emit('commentUpdated', response.data.comment);
  } catch (error) {
    console.error('Failed to update comment:', error);
    alert('Failed to update comment. Please try again.');
  } finally {
    editLoading.value = false;
  }
}

async function handleDelete(commentId: string) {
  confirm.require({
    message: 'Are you sure you want to delete this comment?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: async () => {
      deletingIds.value.add(commentId);
      try {
        await commentsService.deleteComment(commentId);
        emit('commentDeleted', commentId);
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment. Please try again.');
      } finally {
        deletingIds.value.delete(commentId);
      }
    }
  });
}

function loadMoreComments() {
  loadingMore.value = true;
  emit('loadMore');
  // The parent will handle the actual loading
  // Reset the loading state after a short delay to allow parent to update
  setTimeout(() => {
    loadingMore.value = false;
  }, 100);
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
