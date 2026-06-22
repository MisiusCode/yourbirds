<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '../../stores/settings.js';
import { useI18n } from '../../i18n/index.js';

const props = defineProps({
  facts:   { type: Array, default: () => [] },
  factsLt: { type: Array, default: () => [] },
});

const settings = useSettingsStore();
const { t } = useI18n();

const activeFacts = computed(() =>
  settings.lang === 'lt' && props.factsLt?.length ? props.factsLt : props.facts
);
</script>

<template>
  <div>
    <h3 class="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3 flex items-center gap-1.5">
      <span>🦅</span> {{ t.interestingFacts }}
    </h3>
    <ul class="space-y-2.5">
      <li v-for="(fact, i) in activeFacts" :key="i" class="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <span class="text-green-500 font-bold mt-0.5 shrink-0">•</span>
        <span>{{ fact }}</span>
      </li>
    </ul>
  </div>
</template>
