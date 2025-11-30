<template>
  <div
    data-ci="comment-card"
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
            <p data-ci="comment-author-name" class="text-sm font-semibold text-gray-900">
              {{ comment.author.fullName }}
            </p>
            <span v-if="comment.author.role === 'admin'" class="text-xs font-medium text-primary-600">
              Admin
            </span>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span>@{{ comment.author.username }}</span>
            <span class="text-gray-300">•</span>
            <span data-ci="comment-timestamp">{{ formatDate(comment.createdAt) }}</span>
            <span v-if="comment.updatedAt !== comment.createdAt && comment.editedByAdmin" class="text-purple-600">
              • Edited by admin
            </span>
            <span v-else-if="comment.updatedAt !== comment.createdAt">
              • Edited
            </span>
          </div>
        </div>

        <div v-if="canEdit || canDelete" class="flex-shrink-0">
          <div class="flex items-center gap-1">
            <Button
              v-if="canEdit"
              data-ci="comment-edit-button"
              icon="pi pi-pencil"
              rounded
              text
              size="small"
              severity="secondary"
              @click="startEdit"
              :disabled="isDeleting"
              class="hover:bg-gray-100"
              aria-label="Edit comment"
            />
            <Button
              v-if="canDelete"
              data-ci="comment-delete-button"
              icon="pi pi-trash"
              rounded
              text
              size="small"
              severity="danger"
              @click="handleDelete"
              :disabled="isDeleting"
              :loading="isDeleting"
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
      <div v-if="isEditing" class="mt-3 flex flex-col gap-3">
        <Textarea
          data-ci="comment-edit-textarea"
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
            data-ci="comment-edit-save-button"
            label="Save"
            size="small"
            class="bg-primary-500 hover:bg-primary-600 border-primary-500 hover:border-primary-600 rounded-button font-medium transition-colors"
            @click="saveEdit"
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useConfirm } from 'primevue/useconfirm';
import type { Comment } from '@/types/post';
import * as commentsService from '@/services/comments.ajax';
import Avatar from '../Avatar.vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

interface Props {
  comment: Comment;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  commentUpdated: [comment: Comment];
  commentDeleted: [commentId: string];
}>();

const authStore = useAuthStore();
const confirm = useConfirm();
const isEditing = ref(false);
const editContent = ref('');
const editLoading = ref(false);
const isDeleting = ref(false);
const showReplyForm = ref(false);
const replyContent = ref('');
const replyLoading = ref(false);

const canEdit = computed(() => {
  if (!authStore.user) return false;
  return (
    authStore.user.id === props.comment.author.id ||
    authStore.isAdmin
  );
});

const canDelete = computed(() => {
  if (!authStore.user) return false;
  return (
    authStore.user.id === props.comment.author.id ||
    authStore.isAdmin
  );
});

function startEdit() {
  isEditing.value = true;
  editContent.value = props.comment.content;
}

function cancelEdit() {
  isEditing.value = false;
  editContent.value = '';
}

async function saveEdit() {
  if (!editContent.value.trim()) return;

  editLoading.value = true;
  try {
    const response = await commentsService.updateComment(props.comment.id, {
      content: editContent.value,
    });
    isEditing.value = false;
    editContent.value = '';
    emit('commentUpdated', response.data.comment);
  } catch (error) {
    console.error('Failed to update comment:', error);
    alert('Failed to update comment. Please try again.');
  } finally {
    editLoading.value = false;
  }
}

async function handleDelete() {
  confirm.require({
    message: 'Are you sure you want to delete this comment?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: async () => {
      isDeleting.value = true;
      try {
        await commentsService.deleteComment(props.comment.id);
        emit('commentDeleted', props.comment.id);
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment. Please try again.');
      } finally {
        isDeleting.value = false;
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
