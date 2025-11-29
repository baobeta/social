<template>
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
      @click="emit('retry')"
      label="Try again"
      size="small"
      severity="danger"
      text
      class="mt-2"
    />
  </div>

  <!-- Posts List -->
  <div v-else-if="posts?.length > 0" class="space-y-6">
    <slot></slot>

    <!-- Infinite Scroll Trigger -->
    <div ref="loadMoreTrigger" class="py-6 flex justify-center">
      <ProgressSpinner v-if="loadingMore" style="width: 40px; height: 40px" />
      <p v-else-if="hasMore" class="text-gray-400 text-sm">Scroll for more posts...</p>
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
      {{ emptyMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { Post } from '@/types/post';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';
import Button from 'primevue/button';

interface Props {
  posts: Post[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  hasMore?: boolean;
  emptyMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingMore: false,
  error: null,
  hasMore: false,
  emptyMessage: 'No posts yet. Be the first to post!',
});

const emit = defineEmits<{
  retry: [];
  loadMore: [];
}>();

const loadMoreTrigger = ref<HTMLElement | null>(null);
let intersectionObserver: IntersectionObserver | null = null;

function setupIntersectionObserver() {
  cleanupIntersectionObserver();

  if (!loadMoreTrigger.value) return;

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting) {
        emit('loadMore');
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

// Re-setup observer when posts change
watch(() => props.posts.length, async () => {
  await nextTick();
  setupIntersectionObserver();
});

onMounted(async () => {
  await nextTick();
  setupIntersectionObserver();
});

onUnmounted(() => {
  cleanupIntersectionObserver();
});
</script>
