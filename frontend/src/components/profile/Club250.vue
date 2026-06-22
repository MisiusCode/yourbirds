<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useSettingsStore } from '../../stores/settings.js';
import { useI18n } from '../../i18n/index.js';

const settings = useSettingsStore();
const { t } = useI18n();

const years = ref([]);   // [{ year, count, species[] }] sorted desc
const loading = ref(true);
const openYear = ref(null);  // which year's species list is expanded

const currentYear = new Date().getFullYear();

const thisYear = computed(() => years.value.find(y => y.year === currentYear) || { year: currentYear, count: 0, species: [] });
const prevYears = computed(() => years.value.filter(y => y.year !== currentYear));

const progress = computed(() => Math.min(100, (thisYear.value.count / 250) * 100));
const achieved = computed(() => thisYear.value.count >= 250);

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/photos/mine/club250', { withCredentials: true });
    years.value = data;
  } finally {
    loading.value = false;
  }
});

function toggleYear(year) {
  openYear.value = openYear.value === year ? null : year;
}

function speciesName(sp) {
  if (settings.lang === 'lt') return sp.nameLt || sp.nameEn || sp.latinName;
  return sp.nameEn || sp.nameLt || sp.latinName;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('lt-LT', { day: 'numeric', month: 'short', year: 'numeric' });
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🦜 {{ t.club250Title }}
          <span v-if="achieved" class="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-semibold">✓</span>
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ currentYear }} · {{ t.club250Sub }}</p>
      </div>
      <div class="text-right">
        <p class="text-4xl font-black" :class="achieved ? 'text-yellow-500' : 'text-green-600 dark:text-green-400'">
          {{ thisYear.count }}
        </p>
        <p class="text-sm text-gray-400 dark:text-gray-500 font-medium">{{ t.club250Goal }}</p>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="px-6 py-4">
      <div class="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-700"
          :class="achieved ? 'bg-yellow-400' : 'bg-green-500'"
          :style="{ width: progress + '%' }"
        />
      </div>
      <p v-if="achieved" class="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mt-2 text-center">{{ t.club250Achieved }}</p>

      <!-- Species list toggle for current year -->
      <div v-if="thisYear.count > 0" class="mt-3">
        <button
          @click="toggleYear(currentYear)"
          class="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1"
        >
          <svg class="w-3 h-3 transition-transform" :class="openYear === currentYear ? 'rotate-90' : ''" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
          {{ openYear === currentYear ? t.club250HideList : t.club250ShowList }}
          ({{ thisYear.count }} {{ t.club250Species }})
        </button>

        <transition name="slide">
          <div v-if="openYear === currentYear" class="mt-3 max-h-80 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table class="w-full text-xs">
              <tbody>
                <tr
                  v-for="(sp, i) in thisYear.species" :key="sp.latinName"
                  class="border-t border-gray-50 dark:border-gray-700/60 first:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <td class="py-2 pl-3 pr-1 text-gray-400 dark:text-gray-500 font-mono w-7">{{ i + 1 }}</td>
                  <td class="py-2 pr-2">
                    <p class="font-semibold text-gray-800 dark:text-gray-200">{{ speciesName(sp) }}</p>
                    <p class="italic text-gray-400 dark:text-gray-500 text-[11px]">{{ sp.latinName }}</p>
                  </td>
                  <td class="py-2 pr-3 text-right text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {{ formatDate(sp.firstSeen) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </transition>
      </div>
    </div>

    <!-- Previous years -->
    <div v-if="prevYears.length > 0" class="border-t border-gray-100 dark:border-gray-700 px-6 py-4 space-y-2">
      <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{{ t.club250PrevYears }}</p>
      <div v-for="y in prevYears" :key="y.year">
        <button
          @click="toggleYear(y.year)"
          class="w-full flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40 rounded-lg px-2 -mx-2 transition-colors group"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ y.year }}</span>
            <div class="h-1.5 w-24 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="y.count >= 250 ? 'bg-yellow-400' : 'bg-green-400'"
                :style="{ width: Math.min(100, (y.count / 250) * 100) + '%' }"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold" :class="y.count >= 250 ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-400'">
              {{ y.count }} {{ t.club250Species }}
              <span v-if="y.count >= 250"> 🏆</span>
            </span>
            <svg class="w-3 h-3 text-gray-300 dark:text-gray-600 transition-transform" :class="openYear === y.year ? 'rotate-90' : ''" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
            </svg>
          </div>
        </button>

        <transition name="slide">
          <div v-if="openYear === y.year" class="mt-2 mb-1 max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table class="w-full text-xs">
              <tbody>
                <tr
                  v-for="(sp, i) in y.species" :key="sp.latinName"
                  class="border-t border-gray-50 dark:border-gray-700/60 first:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <td class="py-2 pl-3 pr-1 text-gray-400 dark:text-gray-500 font-mono w-7">{{ i + 1 }}</td>
                  <td class="py-2 pr-2">
                    <p class="font-semibold text-gray-800 dark:text-gray-200">{{ speciesName(sp) }}</p>
                    <p class="italic text-gray-400 dark:text-gray-500 text-[11px]">{{ sp.latinName }}</p>
                  </td>
                  <td class="py-2 pr-3 text-right text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {{ formatDate(sp.firstSeen) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </transition>
      </div>
    </div>

    <div v-if="loading" class="px-6 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
      <div class="animate-pulse text-2xl mb-2">🦜</div>
      <p>{{ t.loading }}</p>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; overflow: hidden; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }
.slide-enter-to, .slide-leave-from { max-height: 400px; opacity: 1; }
</style>
