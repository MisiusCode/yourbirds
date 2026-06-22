<script setup>
import { onMounted } from 'vue';
import { usePhotosStore } from '../stores/photos.js';
import { useI18n } from '../i18n/index.js';
import PhotoGrid from '../components/photo/PhotoGrid.vue';

const store = usePhotosStore();
const { t } = useI18n();
onMounted(() => store.fetchHome());
</script>

<template>
  <div class="space-y-14">
    <section>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t.mostVoted }}</h2>
        <span class="text-sm text-gray-400 dark:text-gray-500">{{ t.topRated }}</span>
      </div>
      <div v-if="store.loading" class="text-center py-16 text-gray-400 dark:text-gray-500">
        <div class="animate-pulse text-4xl mb-3">🐦</div>
        <p>{{ t.loadingPhotos }}</p>
      </div>
      <PhotoGrid v-else :photos="store.topPhotos" :empty-message="t.noVotesYet" />
    </section>

    <section>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t.recentPhotos }}</h2>
        <span class="text-sm text-gray-400 dark:text-gray-500">{{ t.latestUploads }}</span>
      </div>
      <PhotoGrid :photos="store.recentPhotos" :empty-message="t.noPhotosYet" />
    </section>
  </div>
</template>
