<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center space-x-4 mb-6">
          <Avatar :full-name="authStore.user!.fullName" size="lg" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ authStore.user!.fullName }}
            </h1>
            <p class="text-gray-500">@{{ authStore.user!.username }}</p>
            <span
              v-if="authStore.isAdmin"
              class="inline-block mt-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded"
            >
              Admin
            </span>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h2>

          <form @submit.prevent="handleUpdate" class="space-y-4">
            <Message v-if="error" severity="error" :closable="true" @close="error = null">
              {{ error }}
            </Message>

            <Message v-if="successMessage" severity="success" :closable="true" @close="successMessage = null">
              {{ successMessage }}
            </Message>

            <div class="flex flex-col gap-2">
              <label for="fullName" class="font-medium text-gray-700">
                Full Name
              </label>
              <InputText
                id="fullName"
                v-model="fullName"
                type="text"
                required
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="font-medium text-gray-700">
                Username
              </label>
              <InputText
                :value="authStore.user!.username"
                type="text"
                disabled
                class="w-full"
              />
              <p class="text-xs text-gray-500">Username cannot be changed</p>
            </div>

            <div class="flex justify-end gap-3">
              <Button
                label="Cancel"
                severity="secondary"
                as="router-link"
                to="/timeline"
                @click="$router.push('/timeline')"
              />
              <Button
                type="submit"
                label="Save Changes"
                severity="primary"
                :disabled="authStore.loading || !hasChanges"
                :loading="authStore.loading"
              />
            </div>
          </form>
        </div>

        <div class="border-t border-gray-200 mt-6 pt-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Account Information</h3>
          <dl class="space-y-2">
            <div v-if="authStore.user?.createdAt" class="flex justify-between text-sm">
              <dt class="text-gray-500">Member since</dt>
              <dd class="text-gray-900">{{ formatDate(authStore.user.createdAt) }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Role</dt>
              <dd class="text-gray-900 capitalize">{{ authStore.user!.role }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import Navbar from '@/components/Navbar.vue';
import Avatar from '@/components/Avatar.vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';

const authStore = useAuthStore();

const fullName = ref('');
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const hasChanges = computed(() => {
  return fullName.value !== authStore.user?.fullName;
});

async function handleUpdate() {
  if (!hasChanges.value) return;

  error.value = null;
  successMessage.value = null;

  try {
    await authStore.updateProfile(fullName.value);
    successMessage.value = 'Profile updated successfully!';
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to update profile';
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

onMounted(() => {
  if (authStore.user) {
    fullName.value = authStore.user.fullName;
  }
});
</script>
