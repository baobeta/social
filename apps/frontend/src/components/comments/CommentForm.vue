<template>
  <form @submit.prevent="handleSubmit" class="flex gap-3">
    <Avatar :full-name="authStore.user!.fullName" size="sm" />
    <div class="flex-1 flex flex-col gap-3">
      <Textarea
        v-model="content"
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
          :disabled="!content.trim() || loading"
          :loading="loading"
        />
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Comment } from '@/types/post';
import * as commentsService from '@/services/comments.ajax';
import Avatar from '../Avatar.vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

interface Props {
  postId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  commentCreated: [comment: Comment];
}>();

const authStore = useAuthStore();
const content = ref('');
const loading = ref(false);

async function handleSubmit() {
  if (!content.value.trim()) return;

  loading.value = true;
  try {
    const response = await commentsService.createComment({
      postId: props.postId,
      content: content.value,
    });
    content.value = '';
    emit('commentCreated', response.data.comment);
  } catch (error) {
    console.error('Failed to create comment:', error);
    alert('Failed to create comment. Please try again.');
  } finally {
    loading.value = false;
  }
}
</script>
