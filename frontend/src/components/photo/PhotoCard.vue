<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '../../stores/settings.js';
import { useI18n } from '../../i18n/index.js';
import StarRating from '../voting/StarRating.vue';

const props = defineProps({
  photo: { type: Object, required: true },
});

const settings = useSettingsStore();
const { t } = useI18n();

const displayName = computed(() => {
  if (settings.lang === 'lt') {
    return props.photo.ai_name_lt || props.photo.ai_name_en || props.photo.ai_latin_name || t.value.unknownBird;
  }
  return props.photo.ai_name_en || props.photo.ai_name_lt || props.photo.ai_latin_name || t.value.unknownBird;
});

const subName = computed(() => {
  if (settings.lang === 'lt') {
    return props.photo.ai_name_lt && props.photo.ai_name_en ? props.photo.ai_name_en : null;
  }
  return props.photo.ai_name_en && props.photo.ai_name_lt ? props.photo.ai_name_lt : null;
});
</script>

<template>
  <RouterLink
    :to="`/photos/${photo.id}`"
    class="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
  >
    <div class="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
      <img
        :src="`/uploads/thumbnails/${photo.filename_thumbnail}`"
        :alt="displayName"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
    </div>
    <div class="p-3">
      <p class="font-semibold text-gray-900 dark:text-white text-sm truncate">{{ displayName }}</p>
      <p v-if="subName" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ subName }}</p>
      <div class="mt-1.5 flex items-center justify-between">
        <StarRating :model-value="Math.round(photo.avg_rating)" :readonly="true" size="sm" />
        <span class="text-xs text-gray-400 dark:text-gray-500">{{ photo.vote_count }}</span>
      </div>
    </div>
  </RouterLink>
</template>
