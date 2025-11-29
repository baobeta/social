<template>
  <div class="min-h-screen bg-surface">
    <Navbar />

    <div class="max-w-3xl mx-auto px-6 py-section">
      <!-- Search Bar -->
      <div class="mb-8">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Search posts by text or username..."
            class="w-full"
          />
        </IconField>
      </div>

      <!-- Create Post -->
      <div class="bg-surface-card rounded-card border border-gray-100 p-6 mb-8 shadow-card hover:shadow-card-hover transition-shadow">
        <form @submit.prevent="handleCreatePost" class="flex flex-col gap-4">
          <Textarea
            v-model="newPostContent"
            placeholder="What's on your mind?"
            :autoResize="true"
            rows="3"
            class="w-full border-gray-200 focus:border-primary-400 focus:ring-primary-400 rounded-lg"
            :disabled="createLoading"
          />
          <div class="flex justify-end">
            <Button
              type="submit"
              :disabled="!newPostContent.trim() || createLoading"
              :loading="createLoading"
              label="Post"
              class="bg-primary-500 hover:bg-primary-600 border-primary-500 hover:border-primary-600 px-6 py-2.5 rounded-button font-medium transition-colors"
            />
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <ProgressSpinner />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center">
        <Message severity="error" :closable="false">
          {{ error }}
        </Message>
        <Button
          @click="() => loadPosts(false)"
          label="Try again"
          size="small"
          severity="danger"
          text
          class="mt-2"
        />
      </div>

      <!-- Posts List -->
      <div v-else-if="displayPosts?.length > 0" class="space-y-6">
        <PostCard
          v-for="post in displayPosts"
          :key="post.id"
          :post="post"
          :loading="editingPostId === post.id || deletingPostId === post.id"
          @edit="startEditPost"
          @delete="handleDeletePost"
          @toggle-comments="handleToggleComments"
        >
          <template #comments>
            <CommentSection
              :post-id="post.id"
              :comments="postComments[post.id] || []"
              :pagination="commentsPagination[post.id] || null"
              @comment-created="(comment) => handleCommentCreated(post.id, comment)"
              @comment-updated="(comment) => handleCommentUpdated(post.id, comment)"
              @comment-deleted="(commentId) => handleCommentDeleted(post.id, commentId)"
              @load-more="() => loadComments(post.id, true)"
            />
          </template>
        </PostCard>

        <!-- Infinite Scroll Trigger -->
        <div ref="loadMoreTrigger" class="py-6 flex justify-center">
          <ProgressSpinner v-if="loadingMore" style="width: 40px; height: 40px" />
          <p v-else-if="hasMorePosts" class="text-gray-400 text-sm">Scroll for more posts...</p>
          <p v-else class="text-gray-400 text-sm">You've reached the end</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p class="mt-4 text-gray-500">
          {{ searchQuery ? 'No posts found matching your search.' : 'No posts yet. Be the first to post!' }}
        </p>
      </div>
    </div>

    <!-- Edit Post Dialog -->
    <Dialog
      v-model:visible="isEditDialogVisible"
      modal
      header="Edit Post"
      :style="{ width: '32rem' }"
      :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    >
      <div class="flex flex-col gap-4">
        <Textarea
          v-model="editContent"
          :autoResize="true"
          rows="4"
          class="w-full"
          :disabled="editLoading"
        />
      </div>
      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          @click="cancelEdit"
          :disabled="editLoading"
        />
        <Button
          label="Save"
          severity="primary"
          @click="saveEdit"
          :disabled="!editContent.trim() || editLoading"
          :loading="editLoading"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Post, Comment, PaginationMeta } from '@/types/post';
import * as postsService from '@/services/posts.ajax';
import * as commentsService from '@/services/comments.ajax';
import Navbar from '@/components/Navbar.vue';
import PostCard from '@/components/PostCard.vue';
import CommentSection from '@/components/CommentSection.vue';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';

const authStore = useAuthStore();

const posts = ref<Post[]>([]);
const postComments = ref<Record<string, Comment[]>>({});
const commentsPagination = ref<Record<string, PaginationMeta>>({});
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const newPostContent = ref('');
const createLoading = ref(false);
const editingPostId = ref<string | null>(null);
const isEditDialogVisible = ref(false);
const editContent = ref('');
const editLoading = ref(false);
const deletingPostId = ref<string | null>(null);

// Pagination state
const pagination = ref<PaginationMeta | null>(null);
const loadingMore = ref(false);
const loadMoreTrigger = ref<HTMLElement | null>(null);
let intersectionObserver: IntersectionObserver | null = null;

const displayPosts = computed(() => {
  if (!authStore.isAdmin) {
    return posts.value.filter((post) => !post.isDeleted);
  }
  return posts.value;
});

const hasMorePosts = computed(() => {
  if (!pagination.value) return false;
  const currentCount = pagination.value.offset + pagination.value.limit;
  return currentCount < pagination.value.total;
});

async function loadPosts(append: boolean = false) {
  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
    posts.value = [];
  }

  error.value = null;

  try {
    const offset = append && pagination.value ? pagination.value.offset + pagination.value.limit : 0;
    const response = await postsService.getPosts({ limit: 20, offset });

    if (append) {
      posts.value = [...posts.value, ...response.data.posts];
    } else {
      posts.value = response.data.posts;
    }

    pagination.value = response.data.pagination || null;

    // Don't load comments automatically - they will be loaded when user expands comments
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load posts';
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

// Handle comment section toggle - load comments only when expanded
async function handleToggleComments(postId: string, expanded: boolean) {
  if (expanded && !postComments.value[postId]) {
    // Load comments only if they haven't been loaded yet
    await loadComments(postId, false);
  }
}

// Handle comment created - add to list without refetching
function handleCommentCreated(postId: string, comment: Comment) {
  if (!postComments.value[postId]) {
    postComments.value[postId] = [];
  }
  // Add new comment at the beginning (newest first)
  postComments.value[postId] = [comment, ...postComments.value[postId]];

  // Update pagination total count
  if (commentsPagination.value[postId]) {
    commentsPagination.value[postId] = {
      ...commentsPagination.value[postId],
      total: commentsPagination.value[postId].total + 1,
    };
  }
}

// Handle comment updated - update in-place
function handleCommentUpdated(postId: string, updatedComment: Comment) {
  if (postComments.value[postId]) {
    const index = postComments.value[postId].findIndex(c => c.id === updatedComment.id);
    if (index !== -1) {
      postComments.value[postId][index] = updatedComment;
    }
  }
}

// Handle comment deleted - remove from list
function handleCommentDeleted(postId: string, commentId: string) {
  if (postComments.value[postId]) {
    postComments.value[postId] = postComments.value[postId].filter(c => c.id !== commentId);

    // Update pagination total count
    if (commentsPagination.value[postId]) {
      commentsPagination.value[postId] = {
        ...commentsPagination.value[postId],
        total: Math.max(0, commentsPagination.value[postId].total - 1),
      };
    }
  }
}

async function loadComments(postId: string, append: boolean = false) {
  try {
    const currentPagination = commentsPagination.value[postId];
    const offset = append && currentPagination
      ? currentPagination.offset + currentPagination.limit
      : 0;

    const response = await commentsService.getComments(postId, {
      limit: 10,
      offset
    });

    if (append) {
      postComments.value[postId] = [
        ...(postComments.value[postId] || []),
        ...response.data.comments
      ];
    } else {
      postComments.value[postId] = response.data.comments;
    }

    if (response.data.pagination) {
      commentsPagination.value[postId] = response.data.pagination;
    }
  } catch (err) {
    console.error('Failed to load comments:', err);
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    await loadPosts(false);
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    const response = await postsService.searchPosts(searchQuery.value);
    posts.value = response.data.posts;
    pagination.value = null; // Reset pagination for search results
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Search failed';
  } finally {
    loading.value = false;
  }
}

async function handleCreatePost() {
  if (!newPostContent.value.trim()) return;

  createLoading.value = true;
  try {
    await postsService.createPost({ content: newPostContent.value });
    newPostContent.value = '';
    await loadPosts(false);
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to create post');
  } finally {
    createLoading.value = false;
  }
}

function startEditPost(post: Post) {
  editingPostId.value = post.id;
  editContent.value = post.content;
  isEditDialogVisible.value = true;
}

function cancelEdit() {
  editingPostId.value = null;
  editContent.value = '';
  isEditDialogVisible.value = false;
}

async function saveEdit() {
  if (!editingPostId.value || !editContent.value.trim()) return;

  editLoading.value = true;
  try {
    await postsService.updatePost(editingPostId.value, {
      content: editContent.value,
    });
    editingPostId.value = null;
    editContent.value = '';
    isEditDialogVisible.value = false;
    await loadPosts(false);
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to update post');
  } finally {
    editLoading.value = false;
  }
}

async function handleDeletePost(post: Post) {
  if (!confirm('Are you sure you want to delete this post?')) return;

  deletingPostId.value = post.id;
  try {
    await postsService.deletePost(post.id);
    await loadPosts(false);
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to delete post');
  } finally {
    deletingPostId.value = null;
  }
}

// Setup intersection observer for infinite scroll
function setupIntersectionObserver() {
  if (!loadMoreTrigger.value) return;

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting && hasMorePosts.value && !loadingMore.value && !loading.value) {
        loadPosts(true);
      }
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    }
  );

  intersectionObserver.observe(loadMoreTrigger.value);
}

function cleanupIntersectionObserver() {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
}

onMounted(async () => {
  await loadPosts(false);
  setupIntersectionObserver();
});

onUnmounted(() => {
  cleanupIntersectionObserver();
});
</script>
