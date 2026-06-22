<script setup>
import { ref, computed } from 'vue';
import { useSettingsStore } from '../../stores/settings.js';
import { useI18n } from '../../i18n/index.js';

const props = defineProps({
  photo: { type: Object, required: true },
  rank: { type: Number, default: null },
  aspectClass: { type: String, default: 'aspect-[4/3]' },
});

const settings = useSettingsStore();
const { t } = useI18n();

// All photos in this group, sorted by group_index
const allPhotos = computed(() => {
  if (!props.photo.group_siblings?.length) return [props.photo];
  return [props.photo, ...props.photo.group_siblings]
    .sort((a, b) => (a.group_index ?? 0) - (b.group_index ?? 0));
});

const isGroup = computed(() => allPhotos.value.length > 1);
const activeIndex = ref(0);

function onMouseMove(e) {
  if (!isGroup.value) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  activeIndex.value = Math.min(allPhotos.value.length - 1, Math.floor(ratio * allPhotos.value.length));
}

function onMouseLeave() {
  activeIndex.value = 0;
}

const activePhoto = computed(() => allPhotos.value[activeIndex.value] ?? props.photo);

const displayName = computed(() => {
  if (settings.lang === 'lt') {
    return props.photo.ai_name_lt || props.photo.ai_name_en || props.photo.ai_latin_name || t.value.unknownBird;
  }
  return props.photo.ai_name_en || props.photo.ai_name_lt || props.photo.ai_latin_name || t.value.unknownBird;
});

const subName = computed(() => {
  if (settings.lang === 'lt') return props.photo.ai_name_lt && props.photo.ai_name_en ? props.photo.ai_name_en : null;
  return props.photo.ai_name_en && props.photo.ai_name_lt ? props.photo.ai_name_lt : null;
});

const formattedDate = computed(() =>
  new Date(props.photo.created_at).toLocaleDateString('lt-LT', { day: 'numeric', month: 'short' })
);

const MEDALS = ['🥇', '🥈', '🥉'];
</script>

<template>
  <RouterLink
    :to="`/photos/${activePhoto.id}`"
    :class="['group relative block overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800', aspectClass]"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- Photo (changes on mouse move across group) -->
    <img
      :src="`/uploads/thumbnails/${activePhoto.filename_thumbnail}`"
      :alt="displayName"
      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      loading="lazy"
    />

    <!-- Rank badge -->
    <div v-if="rank !== null && rank < 3"
      class="absolute top-2 left-2 text-xl leading-none drop-shadow-lg select-none pointer-events-none z-10">
      {{ MEDALS[rank] }}
    </div>
    <div v-else-if="rank !== null"
      class="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold flex items-center justify-center leading-none pointer-events-none z-10">
      {{ rank + 1 }}
    </div>

    <!-- Group photo count badge (top-right, idle) -->
    <div v-if="isGroup"
      class="absolute top-2 right-2 flex items-center gap-1 bg-black/55 backdrop-blur-sm text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full pointer-events-none z-10 group-hover:opacity-0 transition-opacity">
      <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      {{ allPhotos.length }}
    </div>

    <!-- Hover overlay with info -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity duration-250
                flex flex-col justify-end px-3 pb-3 pt-8 pointer-events-none">

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

    <!-- Group progress dots (bottom, visible on hover) -->
    <div v-if="isGroup"
      class="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 z-20 pointer-events-none
             opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div
        v-for="(_, i) in allPhotos"
        :key="i"
        class="rounded-full transition-all duration-150"
        :class="i === activeIndex
          ? 'w-4 h-1.5 bg-white'
          : 'w-1.5 h-1.5 bg-white/45'"
      />
    </div>
  </RouterLink>
</template>
