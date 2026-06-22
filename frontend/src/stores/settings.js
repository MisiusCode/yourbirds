import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref(localStorage.getItem('theme') || 'light');
  const lang = ref(localStorage.getItem('lang') || 'en');

  watch(theme, (v) => {
    localStorage.setItem('theme', v);
    document.documentElement.classList.toggle('dark', v === 'dark');
  }, { immediate: true });

  watch(lang, (v) => localStorage.setItem('lang', v));

  function toggleTheme() { theme.value = theme.value === 'dark' ? 'light' : 'dark'; }
  function toggleLang()  { lang.value  = lang.value  === 'lt'   ? 'en'    : 'lt';  }

  return { theme, lang, toggleTheme, toggleLang };
});
