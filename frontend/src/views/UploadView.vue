<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth.js';
import { useI18n } from '../i18n/index.js';
import SpeciesPanel from '../components/ai/SpeciesPanel.vue';

const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

if (!authStore.user) router.replace('/');

const fileInput = ref(null);
const selectedFiles = ref([]);   // [{ file, previewUrl }]
const title = ref('');
const description = ref('');
const uploading = ref(false);
const identifying = ref(false);
const error = ref('');
const uploadedPhoto = ref(null);
const dragging = ref(false);

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

function addFiles(fileList) {
  const incoming = Array.from(fileList).filter(f => ALLOWED.includes(f.type));
  if (!incoming.length) { error.value = 'Only JPG, PNG, and WebP images are supported.'; return; }
  error.value = '';
  for (const file of incoming) {
    if (selectedFiles.value.length >= 10) break;
    selectedFiles.value.push({ file, previewUrl: URL.createObjectURL(file) });
  }
}

function removeFile(index) {
  URL.revokeObjectURL(selectedFiles.value[index].previewUrl);
  selectedFiles.value.splice(index, 1);
}

function onFileChange(e) { addFiles(e.target.files); e.target.value = ''; }
function onDrop(e) { dragging.value = false; addFiles(e.dataTransfer.files); }

const hasFiles = computed(() => selectedFiles.value.length > 0);

async function submit() {
  if (!hasFiles.value) { error.value = 'Please select at least one photo.'; return; }
  uploading.value = true;
  error.value = '';
  try {
    const formData = new FormData();
    for (const { file } of selectedFiles.value) formData.append('files', file);
    if (title.value.trim()) formData.append('title', title.value.trim());
    if (description.value.trim()) formData.append('description', description.value.trim());
    const { data: photo } = await axios.post('/api/photos', formData, { withCredentials: true });
    uploadedPhoto.value = photo;
  } catch {
    error.value = t.value.uploadFailed;
  } finally {
    uploading.value = false;
  }
}

async function runIdentify() {
  identifying.value = true;
  error.value = '';
  try {
    const { data: ai } = await axios.post('/api/ai/identify', { photo_id: uploadedPhoto.value.id }, { withCredentials: true });
    uploadedPhoto.value = { ...uploadedPhoto.value, ai_latin_name: ai.latin_name, ai_name_lt: ai.name_lt, ai_name_en: ai.name_en, ai_latin_approved: 0 };
  } catch {
    error.value = t.value.identifyFailed;
  } finally {
    identifying.value = false;
  }
}

function onSpeciesUpdated(updatedPhoto) {
  uploadedPhoto.value = updatedPhoto;
  setTimeout(() => router.push(`/photos/${updatedPhoto.id}`), 800);
}

function viewPhoto() { if (uploadedPhoto.value) router.push(`/photos/${uploadedPhoto.value.id}`); }
</script>

<template>
  <div class="max-w-xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">{{ t.uploadTitle }}</h1>

    <!-- Upload form -->
    <div v-if="!uploadedPhoto" class="space-y-6">

      <!-- Drop zone -->
      <div
        class="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all"
        :class="dragging
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 scale-[1.01]'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'"
        @click="fileInput.click()"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <!-- Preview grid -->
        <div v-if="hasFiles">
          <div class="grid grid-cols-3 gap-2 mb-3">
            <div
              v-for="(item, i) in selectedFiles"
              :key="i"
              class="relative group aspect-square"
              @click.stop
            >
              <img :src="item.previewUrl" class="w-full h-full object-cover rounded-lg" />
              <button
                @click.stop="removeFile(i)"
                class="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >✕</button>
              <div v-if="i === 0" class="absolute bottom-1 left-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                AI
              </div>
            </div>

            <!-- Add more slot -->
            <div v-if="selectedFiles.length < 10"
              class="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors cursor-pointer"
              @click.stop="fileInput.click()"
            >
              <div class="text-center">
                <p class="text-2xl leading-none">+</p>
                <p class="text-[10px] mt-0.5">{{ t.addMore }}</p>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedFiles.length }} {{ selectedFiles.length === 1 ? t.photoSelected : t.photosSelected }}
            · {{ t.aiOnFirst }}
          </p>
        </div>

        <!-- Empty state -->
        <div v-else class="py-4">
          <p class="text-5xl mb-3">📷</p>
          <p class="text-gray-600 dark:text-gray-300 font-medium">{{ t.dropPhotos }}</p>
          <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">{{ t.fileTypes }} · {{ t.maxPhotos }}</p>
        </div>

        <input ref="fileInput" type="file" class="hidden" accept="image/jpeg,image/png,image/webp" multiple @change="onFileChange" />
      </div>

      <!-- Title & description -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {{ t.titleLabel }} <span class="text-gray-400 dark:text-gray-500 font-normal">({{ t.optional }})</span>
          </label>
          <input v-model="title"
            class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            :placeholder="t.titlePlaceholder" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {{ t.descriptionLabel }} <span class="text-gray-400 dark:text-gray-500 font-normal">({{ t.optional }})</span>
          </label>
          <textarea v-model="description" rows="3"
            class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            :placeholder="t.descriptionPlaceholder" />
        </div>
      </div>

      <p v-if="error" class="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-2.5">{{ error }}</p>

      <button @click="submit" :disabled="uploading || !hasFiles"
        class="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {{ uploading ? t.uploading : (selectedFiles.length > 1 ? t.uploadPhotos(selectedFiles.length) : t.uploadButton) }}
      </button>
    </div>

    <!-- Post-upload state -->
    <div v-else class="space-y-4">
      <img :src="`/uploads/thumbnails/${uploadedPhoto.filename_thumbnail}`" class="max-h-72 mx-auto rounded-2xl object-contain shadow-lg" />

      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <p class="text-green-700 dark:text-green-400 font-bold text-lg mb-4">{{ t.photoUploaded }}</p>

        <div v-if="identifying" class="text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-4">
          <div class="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          {{ t.aiIdentifying }}
        </div>

        <div v-else-if="uploadedPhoto.ai_latin_name && uploadedPhoto.ai_latin_approved === 0">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ t.aiReview }}</p>
          <SpeciesPanel :photo="uploadedPhoto" @updated="onSpeciesUpdated" />
        </div>

        <div v-else class="space-y-3">
          <p v-if="error" class="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">{{ error }}</p>
          <button @click="runIdentify" :disabled="identifying"
            class="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            </svg>
            {{ identifying ? t.identifying : t.identifyWithAI }}
          </button>
          <button @click="viewPhoto"
            class="w-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {{ t.skipViewPhoto }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
