<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useSettingsStore } from '../../stores/settings.js';
import { useRouter } from 'vue-router';
import { useI18n } from '../../i18n/index.js';
import AuthModal from '../auth/AuthModal.vue';

const authStore = useAuthStore();
const settings = useSettingsStore();
const router = useRouter();
const { t } = useI18n();
const showAuthModal = ref(false);

async function handleLogout() {
  await authStore.logout();
  router.push('/');
}
</script>

<template>
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2 font-bold text-xl text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
        <span class="text-2xl">🐦</span>
        <span>YourBirds</span>
      </RouterLink>

      <nav class="flex items-center gap-4">
        <RouterLink to="/" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" active-class="text-green-700 dark:text-green-400">
          {{ t.gallery }}
        </RouterLink>
        <RouterLink v-if="authStore.user" to="/upload" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" active-class="text-green-700 dark:text-green-400">
          {{ t.upload }}
        </RouterLink>
        <RouterLink v-if="authStore.user" to="/profile" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" active-class="text-green-700 dark:text-green-400">
          {{ t.myPhotos }}
        </RouterLink>

        <!-- Language toggle -->
        <button
          @click="settings.toggleLang()"
          class="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          :title="settings.lang === 'en' ? 'Switch to Lithuanian' : 'Switch to English'"
        >{{ settings.lang === 'en' ? 'LT' : 'EN' }}</button>

        <!-- Dark mode toggle -->
        <button
          @click="settings.toggleTheme()"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :title="settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <svg v-if="settings.theme === 'dark'" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 5.106a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>
          </svg>
        </button>

        <!-- User info / login -->
        <div v-if="authStore.user" class="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
          <img v-if="authStore.user.avatar_url" :src="authStore.user.avatar_url" :alt="authStore.user.name" class="w-8 h-8 rounded-full object-cover ring-2 ring-green-200 dark:ring-green-700" />
          <span class="text-sm text-gray-700 dark:text-gray-200 font-medium hidden sm:block">{{ authStore.user.name }}</span>
          <button @click="handleLogout" class="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            {{ t.logout }}
          </button>
        </div>

        <button v-else @click="showAuthModal = true" class="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          {{ t.login }}
        </button>
      </nav>
    </div>
  </header>

  <AuthModal v-if="showAuthModal" @close="showAuthModal = false" />
</template>
