<template>
  <div
    class="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-100 overflow-x-hidden"
    @mousemove="handleMouseMove"
  >
    <!-- Background Effects -->
    <BackgroundEffects :mouse-pos="mousePos" />

    <!-- Navigation -->
    <LandingNavbar
      :active-users="activeUsers"
      :is-authenticated="authStore.isAuthenticated"
      @sign-in="handleSignIn"
      @sign-out="handleSignOut"
    />

    <!-- Main Content -->
    <main class="relative z-10 px-8 py-16">
      <div class="max-w-6xl mx-auto">
        <!-- Hero Section -->
        <HeroSection
          @get-started="handleGetStarted"
        />

        <!-- Features Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            v-for="(feature, index) in features"
            :key="index"
            :icon="feature.icon"
            :title="feature.title"
            :description="feature.desc"
            :is-hovered="hoveredCard === index"
            @hover="(isHovered) => hoveredCard = isHovered ? index : null"
          />
        </div>

        <!-- Final CTA -->
        <FinalCTA
          :active-users="activeUsers"
          @get-started="handleGetStarted"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import BackgroundEffects from '@/components/landing/BackgroundEffects.vue';
import LandingNavbar from '@/components/landing/LandingNavbar.vue';
import HeroSection from '@/components/landing/HeroSection.vue';
import FeatureCard from '@/components/landing/FeatureCard.vue';
import FinalCTA from '@/components/landing/FinalCTA.vue';

const router = useRouter();
const authStore = useAuthStore();

const activeUsers = ref(12847);
const hoveredCard = ref<number | null>(null);
const mousePos = reactive({ x: 0, y: 0 });

const features = [
  { icon: 'pi pi-users', title: 'Real-time Collaboration', desc: 'Connect with thousands instantly' },
  { icon: 'pi pi-bolt', title: 'Lightning Fast', desc: 'Posts sync in milliseconds' },
  { icon: 'pi pi-globe', title: 'Global Community', desc: 'Join creators worldwide' },
];

let interval: ReturnType<typeof setInterval>;

onMounted(() => {
  interval = setInterval(() => {
    activeUsers.value += Math.floor(Math.random() * 5) - 2;
  }, 2000);
});

onUnmounted(() => {
  clearInterval(interval);
});

function handleMouseMove(e: MouseEvent) {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
}

function handleSignIn() {
  router.push('/login');
}

async function handleSignOut() {
  await authStore.logout();
  router.push('/');
}

function handleGetStarted() {
  if (authStore.isAuthenticated) {
    router.push('/timeline');
  } else {
    router.push('/register');
  }
}

</script>
