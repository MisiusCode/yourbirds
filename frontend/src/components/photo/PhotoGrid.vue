<script setup>
import PhotoCard from './PhotoCard.vue';

defineProps({
  photos: { type: Array, required: true },
  emptyMessage: { type: String, default: 'No photos yet' },
});
</script>

<template>
  <div v-if="photos.length === 0" class="text-center py-20 text-gray-400 dark:text-gray-500">
    <p class="text-6xl mb-4">🐦</p>
    <p class="text-lg">{{ emptyMessage }}</p>
  </div>
  <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
    <PhotoCard v-for="photo in photos" :key="photo.id" :photo="photo" />
  </div>
</template>
