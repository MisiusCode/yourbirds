import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const loading = ref(false);

  async function fetchUser() {
    loading.value = true;
    try {
      const { data } = await axios.get('/auth/me', { withCredentials: true });
      user.value = data.user;
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    await axios.post('/auth/logout', {}, { withCredentials: true });
    user.value = null;
  }

  return { user, loading, fetchUser, logout };
});
