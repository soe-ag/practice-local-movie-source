<script setup lang="ts">
import type { RecommendationCandidate } from "~/utils/type";
import { recommendationSummary } from "~/utils/recommendations";

const props = defineProps<{
  candidate: RecommendationCandidate;
}>();

const popover = ref<{ toggle: (event: Event) => void } | null>(null);
</script>

<template>
  <div class="mt-auto pt-1">
    <button
      type="button"
      class="text-left text-[11px] text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
      :aria-label="`Why ${props.candidate.title} is recommended`"
      @click="popover?.toggle($event)"
    >
      {{ recommendationSummary(props.candidate) }} · Why?
    </button>

    <Popover ref="popover">
      <div class="w-64 text-sm text-gray-700 dark:text-gray-200">
        <div class="font-semibold mb-2">Why recommended</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Recommended from
        </div>
        <ul class="list-disc pl-4 mb-3 text-xs leading-5">
          <li
            v-for="(title, index) in props.candidate.seedTitles"
            :key="`${title}:${index}`"
          >
            {{ title }}
          </li>
        </ul>
        <div
          v-if="props.candidate.sharedGenres.length"
          class="text-xs mb-2"
        >
          <span class="font-semibold">Shared genres:</span>
          {{ props.candidate.sharedGenres.join(", ") }}
        </div>
        <div class="text-xs">
          <span class="font-semibold">TMDB rating:</span>
          {{ props.candidate.rating.toFixed(1) }}
          ({{ props.candidate.voteCount.toLocaleString() }} votes)
        </div>
      </div>
    </Popover>
  </div>
</template>
