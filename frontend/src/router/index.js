import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import UploadView from '../views/UploadView.vue';
import PhotoDetailView from '../views/PhotoDetailView.vue';
import ProfileView from '../views/ProfileView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView, meta: { fullBleed: true } },
    { path: '/upload', component: UploadView },
    { path: '/photos/:id', component: PhotoDetailView },
    { path: '/profile', component: ProfileView },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
