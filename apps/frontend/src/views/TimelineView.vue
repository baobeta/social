<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-2xl mx-auto px-4 py-8">
      <!-- Search Bar -->
      <div class="mb-6">
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
      <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <form @submit.prevent="handleCreatePost" class="flex flex-col gap-3">
          <Textarea
            v-model="newPostContent"
            placeholder="What's on your mind?"
            :autoResize="true"
            rows="3"
            class="w-full"
            :disabled="createLoading"
          />
          <div class="flex justify-end">
            <Button
              type="submit"
              :disabled="!newPostContent.trim() || createLoading"
              :loading="createLoading"
              label="Post"
              size="small"
              severity="primary"
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
          @click="loadPosts"
          label="Try again"
          size="small"
          severity="danger"
          text
          class="mt-2"
        />
      </div>

      <!-- Posts List -->
      <div v-else-if="displayPosts?.length > 0" class="space-y-4">
        <PostCard
          v-for="post in displayPosts"
          :key="post.id"
          :post="post"
          :loading="editingPostId === post.id || deletingPostId === post.id"
          @edit="startEditPost"
          @delete="handleDeletePost"
        >
          <template #comments>
            <CommentSection
              :post-id="post.id"
              :comments="postComments[post.id] || []"
              @refresh="() => loadComments(post.id)"
            />
          </template>
        </PostCard>
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
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Post, Comment } from '@/types/post';
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

const displayPosts = computed(() => {
  if (!authStore.isAdmin) {
    return posts.value.filter((post) => !post.isDeleted);
  }
  return posts.value;
});

async function loadPosts() {
  loading.value = true;
  error.value = null;
  try {
    const response = await postsService.getPosts();
    posts.value = response.data.posts;

    // Load comments for each post
    for (const post of posts.value) {
      await loadComments(post.id);
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load posts';
  } finally {
    loading.value = false;
  }
}

async function loadComments(postId: string) {
  try {
    const response = await commentsService.getComments(postId);
    postComments.value[postId] = response.data.comments;
  } catch (err) {
    console.error('Failed to load comments:', err);
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    await loadPosts();
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    const response = await postsService.searchPosts(searchQuery.value);
    posts.value = response.data.posts;
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
    await loadPosts();
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
    await loadPosts();
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
    await loadPosts();
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to delete post');
  } finally {
    deletingPostId.value = null;
  }
}

onMounted(() => {
  loadPosts();
});
</script>
