import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const usePhotosStore = defineStore('photos', () => {
  const recentPhotos = ref([]);
  const topPhotos = ref([]);
  const loading = ref(false);

  async function fetchHome() {
    loading.value = true;
    try {
      const [recent, top] = await Promise.all([
        axios.get('/api/photos?sort=newest&limit=12', { withCredentials: true }),
        axios.get('/api/photos?sort=rating&limit=12', { withCredentials: true }),
      ]);
      recentPhotos.value = recent.data;
      topPhotos.value = top.data;
    } finally {
      loading.value = false;
    }
  }

  return { recentPhotos, topPhotos, loading, fetchHome };
});
