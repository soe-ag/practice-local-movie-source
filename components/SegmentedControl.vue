<script setup lang="ts" generic="T extends string">
import type { SegmentedOption } from "~/utils/type";

const props = defineProps<{
  modelValue: T;
  options: SegmentedOption<T>[];
  label: string;
  /** Use tab semantics (switches a view) instead of a pressed-button group. */
  tabs?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: T] }>();

const isActive = (value: T) => props.modelValue === value;
</script>

<template>
  <div
    class="inline-flex rounded-full bg-gray-200/80 dark:bg-gray-800/90 p-1 gap-1"
    :role="tabs ? 'tablist' : 'group'"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :role="tabs ? 'tab' : undefined"
      :aria-selected="tabs ? isActive(option.value) : undefined"
      :aria-pressed="tabs ? undefined : isActive(option.value)"
      class="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      :class="
        isActive(option.value)
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow'
          : 'text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700'
      "
      @click="emit('update:modelValue', option.value)"
    >
      <span v-if="option.icon" :class="option.icon" aria-hidden="true" />
      {{ option.label }}
    </button>
  </div>
</template>
