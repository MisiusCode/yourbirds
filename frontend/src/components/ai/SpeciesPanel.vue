<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useI18n } from '../../i18n/index.js';

const props = defineProps({
  photo: { type: Object, required: true },
});

const emit = defineEmits(['updated']);
const { t } = useI18n();

const editing = ref(false);
const editName = ref('');
const loading = ref(false);
const error = ref('');

async function enrichAndEmit(latinName, approved) {
  loading.value = true;
  error.value = '';
  try {
    await axios.patch(`/api/photos/${props.photo.id}`, {
      ai_latin_name: latinName,
      ai_latin_approved: approved,
    }, { withCredentials: true });

    const { data: enriched } = await axios.post('/api/ai/enrich', {
      photo_id: props.photo.id,
      latin_name: latinName,
    }, { withCredentials: true });

    emit('updated', {
      ...props.photo,
      ai_latin_name: latinName,
      ai_latin_approved: approved,
      ai_name_lt: enriched.name_lt,
      ai_name_en: enriched.name_en,
      ai_facts: enriched.facts,
      ai_facts_lt: enriched.facts_lt,
    });
  } catch {
    error.value = 'Something went wrong. Please try again.';
  } finally {
    loading.value = false;
  }
}

function approve() { enrichAndEmit(props.photo.ai_latin_name, 1); }
function startEdit() { editName.value = props.photo.ai_latin_name || ''; editing.value = true; }
function submitEdit() { if (editName.value.trim()) enrichAndEmit(editName.value.trim(), 2); }
</script>

<template>
  <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mt-3">
    <p class="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">{{ t.aiSuggestion }}</p>

    <div v-if="!editing">
      <p class="text-xl font-semibold italic text-gray-800 dark:text-gray-200 mb-0.5">{{ photo.ai_latin_name || 'Unknown' }}</p>
      <p v-if="photo.ai_name_lt" class="text-lg font-bold text-green-700 dark:text-green-400 mb-3">{{ photo.ai_name_lt }}</p>
      <p v-else class="mb-3" />
      <div class="flex flex-wrap gap-2">
        <button @click="approve" :disabled="loading"
          class="bg-green-600 text-white px-5 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
          {{ loading ? t.working : t.approve }}
        </button>
        <button @click="startEdit" :disabled="loading"
          class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
          {{ t.editName }}
        </button>
      </div>
    </div>

    <div v-else class="space-y-2">
      <input v-model="editName"
        class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm italic focus:outline-none focus:ring-2 focus:ring-green-500"
        :placeholder="t.latinPlaceholder"
        @keyup.enter="submitEdit" autofocus />
      <div class="flex gap-2">
        <button @click="submitEdit" :disabled="loading || !editName.trim()"
          class="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
          {{ loading ? t.saving : t.save }}
        </button>
        <button @click="editing = false" :disabled="loading" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          {{ t.cancel }}
        </button>
      </div>
    </div>

    <p v-if="error" class="text-red-600 dark:text-red-400 text-xs mt-2">{{ error }}</p>
  </div>
</template>
