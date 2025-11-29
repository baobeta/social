<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow p-6">
        <ProfileHeader
          :full-name="authStore.user!.fullName"
          :username="authStore.user!.username"
          :is-admin="authStore.isAdmin"
          class="mb-6"
        />

        <ProfileEditForm
          :full-name="fullName"
          @update:full-name="fullName = $event"
          :username="authStore.user!.username"
          :loading="authStore.loading"
          :has-changes="hasChanges"
          :error="error"
          :success-message="successMessage"
          @submit="handleUpdate"
          @cancel="$router.push('/timeline')"
          @clear-error="error = null"
          @clear-success="successMessage = null"
        />

        <ProfileInfo
          :created-at="authStore.user?.createdAt"
          :role="authStore.user!.role"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Navbar from '@/components/Navbar.vue';
import ProfileHeader from '@/components/profile/ProfileHeader.vue';
import ProfileEditForm from '@/components/profile/ProfileEditForm.vue';
import ProfileInfo from '@/components/profile/ProfileInfo.vue';

const router = useRouter();
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
    await authStore.updateProfile({ fullName: fullName.value });
    successMessage.value = 'Profile updated successfully!';
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to update profile';
  }
}

onMounted(() => {
  if (authStore.user) {
    fullName.value = authStore.user.fullName;
  }
});
</script>
