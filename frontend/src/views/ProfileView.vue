<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth.js';
import { useI18n } from '../i18n/index.js';
import PhotoCard from '../components/photo/PhotoCard.vue';
import Club250 from '../components/profile/Club250.vue';

const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

if (!authStore.user) router.replace('/');

const photos = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/photos/mine', { withCredentials: true });
    photos.value = data;
  } finally {
    loading.value = false;
  }
});

async function deletePhoto(id, event) {
  event.preventDefault();
  event.stopPropagation();
  if (!confirm(t.value.deletePhotoConfirm)) return;
  await axios.delete(`/api/photos/${id}`, { withCredentials: true });
  photos.value = photos.value.filter(p => p.id !== id);
}
</script>

<template>
  <div>
    <div class="flex items-center gap-5 mb-10 pb-8 border-b border-gray-200 dark:border-gray-700">
      <img v-if="authStore.user?.avatar_url" :src="authStore.user.avatar_url" :alt="authStore.user.name"
        class="w-20 h-20 rounded-full ring-4 ring-green-100 dark:ring-green-900" />
      <div v-else class="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-3xl">🐦</div>
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ authStore.user?.name }}</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm">{{ authStore.user?.email }}</p>
        <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">{{ t.photosUploaded(photos.length) }}</p>
      </div>
      <RouterLink to="/upload"
        class="ml-auto bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
        + {{ t.upload }}
      </RouterLink>
    </div>

    <Club250 class="mb-10" />

    <div v-if="loading" class="text-center py-16 text-gray-400 dark:text-gray-500">
      <div class="animate-pulse text-4xl mb-3">🐦</div>
      <p>{{ t.loadingYourPhotos }}</p>
    </div>

    <div v-else-if="photos.length === 0" class="text-center py-20">
      <p class="text-6xl mb-4">📷</p>
      <p class="text-gray-500 dark:text-gray-400 text-lg mb-4">{{ t.noPhotos }}</p>
      <RouterLink to="/upload" class="bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors">
        {{ t.uploadFirstPhoto }}
      </RouterLink>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div v-for="photo in photos" :key="photo.id" class="group relative">
        <PhotoCard :photo="photo" />
        <button @click="deletePhoto(photo.id, $event)"
          class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>
