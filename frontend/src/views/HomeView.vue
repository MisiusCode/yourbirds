<script setup>
import { onMounted } from 'vue';
import { usePhotosStore } from '../stores/photos.js';
import { useI18n } from '../i18n/index.js';
import GalleryCard from '../components/photo/GalleryCard.vue';

const store = usePhotosStore();
const { t } = useI18n();
onMounted(() => store.fetchHome());
</script>

<template>
  <div class="flex h-[calc(100dvh-4rem)] bg-gray-100 dark:bg-gray-950 overflow-hidden">

    <!-- ═══ LEFT PANEL: New uploads (70%) ═══ -->
    <div class="flex flex-col min-w-0" style="flex: 7">

      <!-- Panel header -->
      <div class="flex items-center justify-between px-4 h-11 flex-shrink-0
                  bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
          {{ t.recentPhotos }}
        </h2>
        <span class="text-xs text-gray-400 dark:text-gray-500">{{ t.latestUploads }}</span>
      </div>

      <!-- Scrollable grid -->
      <div class="flex-1 overflow-y-auto min-h-0 p-3">

        <!-- Skeleton -->
        <div v-if="store.loading" class="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          <div v-for="n in 16" :key="n"
            class="aspect-[4/3] rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>

        <!-- Empty -->
        <div v-else-if="!store.recentPhotos.length"
          class="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-3">
          <p class="text-5xl">📷</p>
          <p class="text-sm">{{ t.noPhotosYet }}</p>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          <GalleryCard
            v-for="photo in store.recentPhotos"
            :key="photo.id"
            :photo="photo"
          />
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="w-px bg-gray-200 dark:bg-gray-800 flex-shrink-0" />

    <!-- ═══ RIGHT PANEL: Most liked (30%) ═══ -->
    <div class="flex flex-col min-w-0" style="flex: 3">

      <!-- Panel header -->
      <div class="flex items-center justify-between px-4 h-11 flex-shrink-0
                  bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
          {{ t.mostVoted }}
        </h2>
        <span class="text-xs text-gray-400 dark:text-gray-500">{{ t.topRated }}</span>
      </div>

      <!-- Scrollable list -->
      <div class="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">

        <!-- Skeleton -->
        <template v-if="store.loading">
          <div v-for="n in 8" :key="n"
            class="aspect-[4/3] rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </template>

        <!-- Empty -->
        <div v-else-if="!store.topPhotos.length"
          class="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-3">
          <p class="text-5xl">⭐</p>
          <p class="text-sm">{{ t.noVotesYet }}</p>
        </div>

        <!-- Ranked list -->
        <GalleryCard
          v-else
          v-for="(photo, i) in store.topPhotos"
          :key="photo.id"
          :photo="photo"
          :rank="i"
        />
      </div>
    </div>

  </div>
</template>
