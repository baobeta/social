<template>
  <div class="relative max-w-2xl mx-auto mb-24">
    <!-- Glow Effect -->
    <div class="absolute -inset-4 bg-gradient-to-r from-green-200 via-emerald-200 to-teal-200 rounded-3xl blur-2xl opacity-30"></div>

    <!-- Feed Container -->
    <div class="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl p-6">
      <!-- Feed Header -->
      <div class="flex items-center justify-between mb-6">
        <span class="text-lg font-semibold text-gray-800">Live Feed</span>
        <span class="flex items-center gap-2 text-sm text-green-600 font-medium">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>

      <!-- Posts List -->
      <div class="space-y-4 mb-4">
        <div
          v-for="(post, index) in posts"
          :key="post.id"
          class="flex gap-3 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-green-300 transition-all cursor-pointer"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-lg flex-shrink-0">
            {{ post.avatar }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-gray-800">{{ post.user }}</div>
            <div class="text-sm text-gray-600 mb-3">{{ post.content }}</div>
            <div class="flex gap-6">
              <button class="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 transition-colors">
                <i class="pi pi-heart text-xs"></i>
                {{ post.likes }}
              </button>
              <button class="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors">
                <i class="pi pi-comment text-xs"></i>
                {{ post.comments }}
              </button>
              <button class="flex items-center gap-1 text-sm text-gray-500 hover:text-green-500 transition-colors">
                <i class="pi pi-share-alt text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Composer -->
      <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
          👤
        </div>
        <input
          :value="newPost"
          @input="$emit('update:newPost', ($event.target as HTMLInputElement).value)"
          @keyup.enter="$emit('add-post')"
          type="text"
          placeholder="Share something with the community..."
          class="flex-1 bg-transparent border-0 outline-none text-sm text-gray-700 placeholder:text-gray-400"
        />
        <button
          @click="$emit('add-post')"
          class="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center"
        >
          <i class="pi pi-send text-sm"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface Post {
  id: number;
  user: string;
  avatar: string;
  content: string;
  likes: number;
  comments: number;
}

interface Props {
  posts: Post[];
  newPost: string;
}

defineProps<Props>();

defineEmits<{
  'update:newPost': [value: string];
  'add-post': [];
}>();
</script>
