<script setup lang="ts">
import { toastStore } from "./toast.store";
import ToastItem from "./ToastItem.vue";
</script>

<template>
  <div class="animate-slide-in fixed top-4 right-4 z-50 space-y-3 w-80">
    <ToastItem
      v-for="toast in toastStore.state.toasts"
      :key="toast.id"
      :toast="toast"
      @close="toastStore.remove(toast.id)"
    />
  </div>
</template>
<style scoped>
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-slide-in {
  animation: slide-in 0.2s ease-out;
}
</style>
