<script setup lang="ts">
import { computed } from "vue";
import type { Toast } from "./toast.store";

const props = defineProps<{ toast: Toast }>();

const styles = computed(() => {
  switch (props.toast.type) {
    case "success":
      return "bg-green-600 text-white";
    case "error":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-800 text-white";
  }
});
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 px-4 py-3 rounded shadow-lg transition-all duration-300"
    :class="styles"
  >
    <span>{{ toast.message }}</span>

    <button class="text-white/80 hover:text-white" @click="$emit('close')">✕</button>
  </div>
</template>
