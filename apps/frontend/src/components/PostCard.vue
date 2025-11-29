<template>
  <div
    :class="[
      'bg-surface-card rounded-card border shadow-card hover:shadow-card-hover transition-shadow',
      post.isDeleted ? 'border-red-200 bg-red-50' : 'border-gray-100',
    ]"
  >
    <!-- Post Header -->
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
              <span v-if="post.updatedAt !== post.createdAt && post.editedByAdmin" class="text-purple-600">
                • Edited by admin
              </span>
              <span v-else-if="post.updatedAt !== post.createdAt" class="text-gray-500">
                • Edited
              </span>
            </div>
          </div>

          <!-- Three-dot menu for Edit/Delete -->
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
        </div>

        <Tag
          v-if="post.isDeleted"
          value="Deleted"
          severity="danger"
          class="mt-2"
        />
      </div>
    </div>

    <!-- Post Content -->
    <div class="px-card pb-card">
      <p class="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
        {{ post.content }}
      </p>
    </div>

    <!-- Social Actions Footer -->
    <div v-if="showComments" class="border-t border-gray-100 px-card py-3 flex items-center justify-between">
      <button
        @click="toggleComments"
        class="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-500 transition-colors"
      >
        <i class="pi pi-comment"></i>
        <span class="font-medium">{{ post.commentsCount || 0 }}</span>
      </button>

      <button
        @click="toggleComments"
        :class="[
          'text-sm font-medium transition-colors',
          commentsExpanded ? 'text-gray-600 hover:text-gray-700' : 'text-primary-500 hover:text-primary-600'
        ]"
      >
        {{ commentsExpanded ? 'Hide comments' : 'Show comments' }}
      </button>
    </div>

    <!-- Comments Section -->
    <div v-if="showComments && commentsExpanded" class="border-t border-gray-100">
      <slot name="comments"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
  toggleComments: [postId: string, expanded: boolean];
}>();

const authStore = useAuthStore();
const confirm = useConfirm();
const commentsExpanded = ref(false);
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

function toggleComments() {
  commentsExpanded.value = !commentsExpanded.value;
  emit('toggleComments', props.post.id, commentsExpanded.value);
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
