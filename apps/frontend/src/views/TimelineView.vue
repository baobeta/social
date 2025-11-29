<template>
  <div class="min-h-screen bg-surface">
    <Navbar />

    <div class="max-w-3xl mx-auto px-6 py-section">
      <SearchBar
        v-model="searchQuery"
        @search="handleSearch"
      />

      <!-- Admin toggle to show/hide deleted posts -->
      <div v-if="authStore.isAdmin" class="mb-4 flex items-center gap-2 p-4 bg-white rounded-lg shadow">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            v-model="showDeletedPosts"
            @change="handleToggleDeletedPosts"
            class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span class="text-sm font-medium text-gray-700">Show deleted posts</span>
        </label>
      </div>

      <CreatePostForm
        v-model="newPostContent"
        :loading="createLoading"
        @submit="handleCreatePost"
      />

      <PostsList
        :posts="displayPosts"
        :loading="loading"
        :loading-more="loadingMore"
        :error="error"
        :has-more="hasMorePosts"
        :empty-message="searchQuery ? 'No posts found matching your search.' : 'No posts yet. Be the first to post!'"
        @retry="() => loadPosts(false)"
        @load-more="handleLoadMore"
      >
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
      </PostsList>
    </div>

    <EditPostDialog
      v-model:visible="isEditDialogVisible"
      v-model="editContent"
      :loading="editLoading"
      @save="saveEdit"
      @cancel="cancelEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Post, Comment, PaginationMeta } from '@/types/post';
import * as postsService from '@/services/posts.ajax';
import * as commentsService from '@/services/comments.ajax';
import Navbar from '@/components/Navbar.vue';
import PostCard from '@/components/posts/PostCard.vue';
import CommentSection from '@/components/comments/CommentSection.vue';
import SearchBar from '@/components/timeline/SearchBar.vue';
import CreatePostForm from '@/components/timeline/CreatePostForm.vue';
import PostsList from '@/components/timeline/PostsList.vue';
import EditPostDialog from '@/components/timeline/EditPostDialog.vue';

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
const showDeletedPosts = ref(false);

// Pagination state
const pagination = ref<PaginationMeta | null>(null);
const loadingMore = ref(false);

const displayPosts = computed(() => {
  // No client-side filtering - backend handles this now
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
    const response = await postsService.getPosts({
      limit: 20,
      offset,
      includeDeleted: authStore.isAdmin ? showDeletedPosts.value : false
    });

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

async function handleToggleDeletedPosts() {
  // Reload posts when toggle changes
  await loadPosts(false);
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
  } else {
    // Initialize pagination if it doesn't exist
    commentsPagination.value[postId] = {
      total: 1,
      limit: 10,
      offset: 0,
    };
  }

  // Update post's comment count in the UI
  const post = posts.value.find(p => p.id === postId);
  if (post) {
    post.commentsCount = (post.commentsCount || 0) + 1;
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

  // Update post's comment count in the UI
  const post = posts.value.find(p => p.id === postId);
  if (post) {
    post.commentsCount = Math.max(0, (post.commentsCount || 0) - 1);
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

function handleLoadMore() {
  if (hasMorePosts.value && !loadingMore.value && !loading.value) {
    loadPosts(true);
  }
}

onMounted(async () => {
  await loadPosts(false);
});
</script>
