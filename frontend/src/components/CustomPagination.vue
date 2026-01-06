<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  page: number;
  totalPages: number;
}>();

const emit = defineEmits<(e: "change", page: number) => void>();

const pages = computed(() => {
  const p = props.page;
  const t = props.totalPages;

  if (t <= 3) {
    return Array.from({ length: t }, (_, i) => i + 1);
  }

  if (p <= 2) {
    return [1, 2, 3];
  }

  if (p >= t - 1) {
    return [t - 2, t - 1, t];
  }

  return [p - 1, p, p + 1];
});

const showLeftEllipsis = computed(() => {
  return props.totalPages > 3 && pages.value[0] > 1;
});

const showRightEllipsis = computed(() => {
  return props.totalPages > 3 && pages.value[pages.value.length - 1] < props.totalPages;
});

const go = (page: number) => {
  if (page < 1 || page > props.totalPages) return;
  emit("change", page);
};
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-end gap-1 mt-6">
    <!-- Prev -->
    <button
      class="px-3 py-1 text-sm rounded border hover:bg-muted disabled:opacity-50"
      :disabled="page === 1"
      @click="go(page - 1)"
    >
      Prev
    </button>

    <!-- Left Ellipsis -->
    <span v-if="showLeftEllipsis" class="px-2 text-muted-foreground"> … </span>

    <!-- Page Numbers -->
    <button
      v-for="p in pages"
      :key="p"
      class="px-3 py-1 text-sm rounded border"
      :class="p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
      @click="go(p)"
    >
      {{ p }}
    </button>

    <!-- Right Ellipsis -->
    <span v-if="showRightEllipsis" class="px-2 text-muted-foreground"> … </span>

    <!-- Next -->
    <button
      class="px-3 py-1 text-sm rounded border hover:bg-muted disabled:opacity-50"
      :disabled="page === totalPages"
      @click="go(page + 1)"
    >
      Next
    </button>
  </div>
</template>
