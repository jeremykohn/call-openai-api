<template>
  <div
    :id="containerId"
    role="alert"
    class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
  >
    <p v-if="title" class="font-semibold">{{ title }}</p>
    <p>{{ message }}</p>
    <button
      v-if="enableDetailsToggle && details"
      type="button"
      :data-testid="detailsToggleTestId"
      class="mt-1 text-sm font-semibold underline hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
      :aria-expanded="isDetailsVisible ? 'true' : 'false'"
      @click="isDetailsVisible = !isDetailsVisible"
    >
      {{ isDetailsVisible ? "Hide details" : "Show details" }}
    </button>
    <p v-if="showDetails" class="mt-1 text-red-700">
      <span class="font-semibold">Details:</span> {{ details }}
    </p>
    <button
      v-if="showRetry"
      type="button"
      :data-testid="retryButtonTestId"
      class="mt-2 text-sm font-semibold underline hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    message: string;
    title?: string;
    details?: string;
    containerId?: string;
    showRetry?: boolean;
    retryLabel?: string;
    retryButtonTestId?: string;
    enableDetailsToggle?: boolean;
    detailsToggleTestId?: string;
  }>(),
  {
    title: undefined,
    details: undefined,
    containerId: undefined,
    showRetry: false,
    retryLabel: "Try again",
    retryButtonTestId: "retry-button",
    enableDetailsToggle: false,
    detailsToggleTestId: "details-toggle",
  },
);

const isDetailsVisible = ref(false);

const showDetails = computed(() => {
  if (!props.details) {
    return false;
  }

  if (!props.enableDetailsToggle) {
    return true;
  }

  return isDetailsVisible.value;
});

const emit = defineEmits<{
  retry: [];
}>();
</script>
