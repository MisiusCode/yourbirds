<script setup>
import { computed } from 'vue';
import { useI18n } from '../../i18n/index.js';

const props = defineProps({
  photo: { type: Object, required: true },
});

const { t } = useI18n();

const rows = computed(() => {
  const r = [];
  if (props.photo.exif_camera_model) r.push({ key: 'camera',      value: props.photo.exif_camera_model });
  if (props.photo.exif_aperture)     r.push({ key: 'aperture',    value: props.photo.exif_aperture });
  if (props.photo.exif_iso)          r.push({ key: 'iso',         value: String(props.photo.exif_iso) });
  if (props.photo.exif_focal_length) r.push({ key: 'focalLength', value: props.photo.exif_focal_length });
  if (props.photo.exif_taken_at)     r.push({ key: 'taken',       value: new Date(props.photo.exif_taken_at).toLocaleDateString('lt-LT', { day: 'numeric', month: 'long', year: 'numeric' }) });
  if (props.photo.exif_gps_lat && props.photo.exif_gps_lng) {
    const lat = Math.abs(props.photo.exif_gps_lat).toFixed(4) + (props.photo.exif_gps_lat >= 0 ? '°N' : '°S');
    const lng = Math.abs(props.photo.exif_gps_lng).toFixed(4) + (props.photo.exif_gps_lng >= 0 ? '°E' : '°W');
    r.push({ key: 'location', value: `${lat}, ${lng}` });
  }
  return r;
});
</script>

<template>
  <div v-if="rows.length > 0">
    <h3 class="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3 flex items-center gap-1.5">
      <span>📷</span> {{ t.cameraData }}
    </h3>
    <table class="w-full text-sm">
      <tbody>
        <tr v-for="row in rows" :key="row.key" class="border-t border-gray-100 dark:border-gray-700 first:border-0">
          <td class="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{{ t[row.key] }}</td>
          <td class="py-2 text-gray-900 dark:text-gray-200">{{ row.value }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="text-sm text-gray-400 dark:text-gray-500 italic">{{ t.noExif }}</div>
</template>
