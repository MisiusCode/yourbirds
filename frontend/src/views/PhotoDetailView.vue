<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth.js';
import { useI18n } from '../i18n/index.js';
import ExifDisplay from '../components/photo/ExifDisplay.vue';
import BirdFacts from '../components/ai/BirdFacts.vue';
import SpeciesPanel from '../components/ai/SpeciesPanel.vue';
import StarRating from '../components/voting/StarRating.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const photo = ref(null);
const loading = ref(true);
const notFound = ref(false);
const userVote = ref(0);
const voteLoading = ref(false);
const voteError = ref('');
const identifying = ref(false);

const editingField = ref(null);
const editValue = ref('');
const editSaving = ref(false);

const isOwner = computed(() => photo.value && authStore.user?.id === photo.value.user_id);

const displayName = computed(() => {
  if (!photo.value) return '';
  return photo.value.ai_name_lt || photo.value.ai_name_en || photo.value.ai_latin_name || t.value.unknownBird;
});

onMounted(async () => {
  try {
    const { data } = await axios.get(`/api/photos/${route.params.id}`, { withCredentials: true });
    photo.value = data;
    const ogName = data.ai_name_lt || data.ai_name_en || data.ai_latin_name || 'Bird photo';
    setOgMeta('og:title', [data.title, ogName].filter(Boolean).join(' — '));
    setOgMeta('og:description', data.description || ogName);
    setOgMeta('og:image', `${window.location.origin}/uploads/thumbnails/${data.filename_thumbnail}`);
    setOgMeta('og:url', window.location.href);
    setOgMeta('og:type', 'article');
    if (authStore.user && !isOwner.value) {
      const { data: voteData } = await axios.get(`/api/photos/${route.params.id}/vote`, { withCredentials: true });
      userVote.value = voteData.stars || 0;
    }
  } catch {
    notFound.value = true;
  } finally {
    loading.value = false;
  }
});

async function castVote(stars) {
  if (!authStore.user || isOwner.value || voteLoading.value) return;
  voteLoading.value = true;
  voteError.value = '';
  try {
    const { data } = await axios.post(`/api/photos/${route.params.id}/vote`, { stars }, { withCredentials: true });
    userVote.value = stars;
    photo.value.avg_rating = data.avg_rating;
    photo.value.vote_count = data.vote_count;
  } catch (e) {
    voteError.value = e.response?.data?.error || 'Vote failed';
  } finally {
    voteLoading.value = false;
  }
}

function onSpeciesUpdated(updated) { photo.value = { ...photo.value, ...updated }; }

async function identify() {
  identifying.value = true;
  try {
    const { data: ai } = await axios.post('/api/ai/identify', { photo_id: route.params.id }, { withCredentials: true });
    photo.value = { ...photo.value, ai_latin_name: ai.latin_name, ai_name_lt: ai.name_lt, ai_name_en: ai.name_en, ai_latin_approved: 0 };
  } catch { /* button stays for retry */ }
  finally { identifying.value = false; }
}

async function deletePhoto() {
  if (!confirm(t.value.deletePhotoConfirm)) return;
  await axios.delete(`/api/photos/${route.params.id}`, { withCredentials: true });
  router.push('/profile');
}

function shareToFacebook() {
  const name = photo.value.ai_name_lt || photo.value.ai_name_en || photo.value.ai_latin_name || '';
  const quote = [name, photo.value.description].filter(Boolean).join(' — ');
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}${quote ? `&quote=${encodeURIComponent(quote)}` : ''}`;
  window.open(shareUrl, 'fb-share', 'width=620,height=440,left=200,top=100');
}

function setOgMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function startEdit(field, currentValue) { editingField.value = field; editValue.value = currentValue || ''; }
function cancelEdit() { editingField.value = null; editValue.value = ''; }

async function saveEdit() {
  if (!editingField.value) return;
  editSaving.value = true;
  try {
    const fieldMap = { name_lt: 'ai_name_lt', name_en: 'ai_name_en', latin_name: 'ai_latin_name' };
    await axios.patch(`/api/photos/${route.params.id}`, { [fieldMap[editingField.value]]: editValue.value.trim() }, { withCredentials: true });
    photo.value[fieldMap[editingField.value]] = editValue.value.trim();
    editingField.value = null;
    editValue.value = '';
  } catch { /* ignore */ }
  finally { editSaving.value = false; }
}
</script>

<template>
  <div v-if="loading" class="text-center py-24 text-gray-400 dark:text-gray-500">
    <div class="animate-pulse text-5xl mb-3">🐦</div>
    <p>{{ t.loading }}</p>
  </div>

  <div v-else-if="notFound" class="text-center py-24">
    <p class="text-5xl mb-4">🔍</p>
    <p class="text-gray-500 dark:text-gray-400 text-lg">{{ t.photoNotFound }}</p>
    <RouterLink to="/" class="text-green-600 dark:text-green-400 hover:underline text-sm mt-2 inline-block">{{ t.backToGalleryLink }}</RouterLink>
  </div>

  <div v-else-if="photo" class="space-y-6">
    <div class="flex items-center justify-between">
      <RouterLink to="/" class="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">{{ t.backToGallery }}</RouterLink>
      <button v-if="isOwner" @click="deletePhoto" class="text-xs text-red-400 hover:text-red-600 transition-colors">{{ t.deletePhoto }}</button>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 items-start">

      <!-- LEFT: Photo + rating -->
      <div class="w-full lg:w-3/5 lg:sticky lg:top-24 space-y-4">
        <div class="relative group">
          <img
            :src="`/uploads/originals/${photo.filename_original}`"
            :alt="displayName"
            class="w-full rounded-2xl shadow-xl object-contain max-h-[70vh] bg-gray-900"
          />
          <a :href="`/uploads/originals/${photo.filename_original}`" target="_blank" rel="noopener"
            class="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2"/>
            </svg>
            {{ t.fullResolution }}
          </a>
        </div>
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {{ t.by }} {{ photo.user_name }} ·
            {{ new Date(photo.created_at).toLocaleDateString('lt-LT', { day: 'numeric', month: 'long', year: 'numeric' }) }}
          </p>
          <button @click="shareToFacebook"
            class="flex items-center gap-1.5 text-xs font-medium text-white bg-[#1877F2] hover:bg-[#166FE5] px-3 py-1.5 rounded-lg transition-colors">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            {{ t.shareToFacebook }}
          </button>
        </div>

        <!-- Rating -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm text-center">
          <template v-if="isOwner">
            <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium mb-2">{{ t.communityRating }}</p>
            <StarRating :model-value="Math.round(photo.avg_rating)" :readonly="true" size="lg" />
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1.5">
              {{ photo.avg_rating }}/5 · {{ photo.vote_count }} {{ photo.vote_count === 1 ? t.vote : t.votes }}
            </p>
          </template>
          <template v-else-if="!authStore.user">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">{{ t.loginToRate }}</p>
            <StarRating :model-value="0" :readonly="true" size="lg" />
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1.5">
              {{ photo.avg_rating }}/5 · {{ photo.vote_count }} {{ photo.vote_count === 1 ? t.vote : t.votes }}
            </p>
          </template>
          <template v-else>
            <p class="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">{{ userVote ? t.yourRating : t.rateThisPhoto }}</p>
            <StarRating :model-value="userVote" :readonly="voteLoading" size="lg" @update:model-value="castVote" />
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1.5">
              {{ photo.avg_rating }}/5 · {{ photo.vote_count }} {{ photo.vote_count === 1 ? t.vote : t.votes }}
            </p>
            <p v-if="voteError" class="text-red-500 text-xs mt-1">{{ voteError }}</p>
          </template>
        </div>
      </div>

      <!-- RIGHT: Info panel -->
      <div class="w-full lg:w-2/5 space-y-4">

        <!-- Names -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ photo.title || displayName }}</h1>

          <div class="space-y-3">
            <!-- Lithuanian -->
            <div v-if="photo.ai_name_lt || isOwner" class="group">
              <p class="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold mb-0.5">{{ t.nameLtLabel }}</p>
              <div v-if="editingField === 'name_lt'" class="flex gap-2 items-center">
                <input v-model="editValue"
                  class="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-green-800 dark:text-green-300 font-bold rounded-lg px-2.5 py-1.5 text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  @keyup.enter="saveEdit" @keyup.escape="cancelEdit" autofocus />
                <button @click="saveEdit" :disabled="editSaving" class="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">{{ t.save }}</button>
                <button @click="cancelEdit" class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
              </div>
              <div v-else class="flex items-center gap-2">
                <p class="text-2xl font-bold text-green-800 dark:text-green-400">{{ photo.ai_name_lt || '—' }}</p>
                <button v-if="isOwner" @click="startEdit('name_lt', photo.ai_name_lt)" class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 text-sm">✎</button>
              </div>
            </div>

            <!-- English -->
            <div v-if="photo.ai_name_en || isOwner" class="group">
              <p class="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold mb-0.5">{{ t.nameEnLabel }}</p>
              <div v-if="editingField === 'name_en'" class="flex gap-2 items-center">
                <input v-model="editValue"
                  class="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg px-2.5 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                  @keyup.enter="saveEdit" @keyup.escape="cancelEdit" autofocus />
                <button @click="saveEdit" :disabled="editSaving" class="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">{{ t.save }}</button>
                <button @click="cancelEdit" class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
              </div>
              <div v-else class="flex items-center gap-2">
                <p class="text-xl font-semibold text-gray-800 dark:text-gray-200">{{ photo.ai_name_en || '—' }}</p>
                <button v-if="isOwner" @click="startEdit('name_en', photo.ai_name_en)" class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 text-sm">✎</button>
              </div>
            </div>

            <!-- Latin -->
            <div v-if="photo.ai_latin_name || isOwner" class="group">
              <p class="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold mb-0.5">{{ t.scientificLabel }}</p>
              <div v-if="editingField === 'latin_name'" class="flex gap-2 items-center">
                <input v-model="editValue"
                  class="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  @keyup.enter="saveEdit" @keyup.escape="cancelEdit" autofocus />
                <button @click="saveEdit" :disabled="editSaving" class="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50">{{ t.save }}</button>
                <button @click="cancelEdit" class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
              </div>
              <div v-else class="flex items-center gap-2">
                <p class="text-base italic text-gray-500 dark:text-gray-400">{{ photo.ai_latin_name || '—' }}</p>
                <button v-if="isOwner" @click="startEdit('latin_name', photo.ai_latin_name)" class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 text-sm">✎</button>
              </div>
            </div>
          </div>

          <!-- Pending approval -->
          <div v-if="isOwner && photo.ai_latin_name && photo.ai_latin_approved === 0" class="mt-4">
            <SpeciesPanel :photo="photo" @updated="onSpeciesUpdated" />
          </div>

          <!-- No AI data yet -->
          <div v-if="isOwner && !photo.ai_latin_name" class="mt-4">
            <button @click="identify" :disabled="identifying"
              class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              <span v-if="identifying" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              </svg>
              {{ identifying ? t.identifying : t.identifyWithAI }}
            </button>
          </div>

          <div v-if="photo.description" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ photo.description }}</p>
          </div>
        </div>

        <!-- EXIF -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <ExifDisplay :photo="photo" />
        </div>

        <!-- Bird facts -->
        <div v-if="photo.ai_facts?.length || photo.ai_facts_lt?.length" class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <BirdFacts :facts="photo.ai_facts || []" :facts-lt="photo.ai_facts_lt || []" />
        </div>
      </div>
    </div>
  </div>
</template>
