<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
});

const emit = defineEmits(['update:modelValue']);
const hovered = ref(0);

function onClick(n) {
  if (!props.readonly) emit('update:modelValue', n);
}
</script>

<template>
  <div class="flex gap-0.5 items-center" :class="size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-base' : 'text-2xl'">
    <button
      v-for="n in 5"
      :key="n"
      @click="onClick(n)"
      @mouseenter="!readonly && (hovered = n)"
      @mouseleave="hovered = 0"
      :disabled="readonly"
      class="transition-transform leading-none"
      :class="[
        (hovered || modelValue) >= n ? 'text-yellow-400' : 'text-gray-300',
        !readonly ? 'hover:scale-125 cursor-pointer' : 'cursor-default',
      ]"
      :title="readonly ? undefined : `${n} star${n > 1 ? 's' : ''}`"
    >
      ★
    </button>
  </div>
</template>
