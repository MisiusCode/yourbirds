<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '../../stores/settings.js';
import { useI18n } from '../../i18n/index.js';

const props = defineProps({
  photo: { type: Object, required: true },
  rank: { type: Number, default: null },
  aspectClass: { type: String, default: 'aspect-[4/3]' },
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

const formattedDate = computed(() =>
  new Date(props.photo.created_at).toLocaleDateString('lt-LT', { day: 'numeric', month: 'short' })
);

const MEDALS = ['🥇', '🥈', '🥉'];
</script>

<template>
  <RouterLink
    :to="`/photos/${photo.id}`"
    :class="['group relative block overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800', aspectClass]"
  >
    <img
      :src="`/uploads/thumbnails/${photo.filename_thumbnail}`"
      :alt="displayName"
      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      loading="lazy"
    />

    <!-- Rank badge -->
    <div v-if="rank !== null && rank < 3"
      class="absolute top-2 left-2 text-xl leading-none drop-shadow-lg select-none pointer-events-none">
      {{ MEDALS[rank] }}
    </div>
    <div v-else-if="rank !== null"
      class="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold flex items-center justify-center leading-none pointer-events-none">
      {{ rank + 1 }}
    </div>

    <!-- Hover overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity duration-250
                flex flex-col justify-end px-3 pb-3 pt-8">

      <p class="text-white font-bold text-sm leading-tight line-clamp-1 drop-shadow">{{ displayName }}</p>
      <p v-if="subName" class="text-gray-300 text-xs mt-0.5 line-clamp-1 italic">{{ subName }}</p>

      <div class="flex items-center justify-between mt-2 gap-2">
        <p class="text-gray-400 text-[11px] truncate">{{ photo.user_name }}</p>
        <p class="text-gray-400 text-[11px] flex-shrink-0">{{ formattedDate }}</p>
      </div>

      <div v-if="photo.vote_count > 0" class="flex items-center gap-1 mt-1">
        <span class="text-yellow-400 text-[11px]">★ {{ photo.avg_rating }}</span>
        <span class="text-gray-500 text-[11px]">· {{ photo.vote_count }}</span>
      </div>
    </div>
  </RouterLink>
</template>
