<template>
  <div class="space-y-3">
    <!-- Add comment form -->
    <form @submit.prevent="handleSubmit" class="flex gap-2">
      <Avatar :full-name="authStore.user!.fullName" size="sm" />
      <div class="flex-1 flex flex-col gap-2">
        <Textarea
          v-model="newComment"
          placeholder="Write a comment..."
          :autoResize="true"
          rows="2"
          class="w-full text-sm"
          :disabled="loading"
        />
        <div class="flex justify-end">
          <Button
            type="submit"
            label="Comment"
            size="small"
            severity="primary"
            :disabled="!newComment.trim() || loading"
            :loading="loading"
          />
        </div>
      </div>
    </form>

    <!-- Comments list -->
    <div v-if="localComments.length > 0" class="space-y-3 mt-4">
      <div
        v-for="comment in localComments"
        :key="comment.id"
        :class="[
          'flex space-x-3 p-3 rounded-lg',
          comment.isDeleted ? 'bg-red-50 border border-red-200' : 'bg-gray-50',
        ]"
      >
        <Avatar :full-name="comment.author.fullName" size="sm" />

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-gray-900">
                {{ comment.author.fullName }}
              </p>
              <p class="text-xs text-gray-500">@{{ comment.author.username }}</p>
              <Tag
                v-if="comment.author.role === 'admin'"
                value="Admin"
                severity="secondary"
                size="small"
              />
              <Tag
                v-if="comment.isDeleted"
                value="Deleted"
                severity="danger"
                size="small"
              />
            </div>

            <div class="flex items-center gap-2">
              <Button
                v-if="canEdit(comment)"
                label="Edit"
                size="small"
                text
                severity="primary"
                @click="startEdit(comment)"
                :disabled="deletingIds.has(comment.id)"
              />
              <Button
                v-if="canDelete(comment)"
                label="Delete"
                size="small"
                text
                severity="danger"
                @click="handleDelete(comment.id)"
                :disabled="deletingIds.has(comment.id)"
                :loading="deletingIds.has(comment.id)"
              />
            </div>
          </div>

          <!-- Edit mode -->
          <div v-if="editingId === comment.id" class="mt-2 flex flex-col gap-2">
            <Textarea
              v-model="editContent"
              :autoResize="true"
              rows="2"
              class="w-full text-sm"
              :disabled="editLoading"
            />
            <div class="flex justify-end gap-2">
              <Button
                label="Cancel"
                size="small"
                severity="secondary"
                @click="cancelEdit"
                :disabled="editLoading"
              />
              <Button
                label="Save"
                size="small"
                severity="primary"
                @click="saveEdit(comment.id)"
                :disabled="!editContent.trim() || editLoading"
                :loading="editLoading"
              />
            </div>
          </div>

          <!-- Display mode -->
          <p v-else class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
            {{ comment.content }}
          </p>

          <div class="mt-1 flex items-center space-x-3 text-xs text-gray-500">
            <span>{{ formatDate(comment.createdAt) }}</span>
            <span v-if="comment.updatedAt !== comment.createdAt" class="flex items-center space-x-1">
              <span>•</span>
              <span v-if="comment.editedByAdmin" class="text-purple-600">
                Edited by admin
              </span>
              <span v-else>Edited</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-gray-500 text-center py-4">
      No comments yet. Be the first to comment!
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useConfirm } from 'primevue/useconfirm';
import type { Comment } from '@/types/post';
import * as commentsService from '@/services/comments.ajax';
import Avatar from './Avatar.vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

interface Props {
  postId: string;
  comments: Comment[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
}>();

const authStore = useAuthStore();
const confirm = useConfirm();
const newComment = ref('');
const loading = ref(false);
const editingId = ref<string | null>(null);
const editContent = ref('');
const editLoading = ref(false);
const deletingIds = ref(new Set<string>());

const localComments = computed(() => {
  return props.comments.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
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
    await commentsService.createComment({
      postId: props.postId,
      content: newComment.value,
    });
    newComment.value = '';
    emit('refresh');
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
    await commentsService.updateComment(commentId, {
      content: editContent.value,
    });
    editingId.value = null;
    editContent.value = '';
    emit('refresh');
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
        emit('refresh');
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment. Please try again.');
      } finally {
        deletingIds.value.delete(commentId);
      }
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
