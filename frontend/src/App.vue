<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth.js';
import { useSettingsStore } from './stores/settings.js';
import AppHeader from './components/layout/AppHeader.vue';

const authStore = useAuthStore();
const route = useRoute();
useSettingsStore(); // triggers the immediate watcher that applies dark class

onMounted(async () => {
  if (route.query.auth) {
    window.history.replaceState({}, document.title, '/');
  }
  await authStore.fetchUser();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <AppHeader />
    <main :class="route.meta?.fullBleed ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 py-8'">
      <RouterView />
    </main>
  </div>
</template>
