<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

interface Props {
  label: string;
  to?: string;
  icon?: string;
  exact?: boolean;
  disabled?: boolean;
}

const props = defineProps<Props>();
const route = useRoute();
const router = useRouter();

const isActive = computed(() => {
  if (!props.to) return false;
  return props.exact ? route.path === props.to : route.path.startsWith(props.to);
});

function navigate() {
  if (!props.to || props.disabled) return;
  router.push(props.to);
}
</script>

<template>
  <div
    class="flex items-center gap-3 px-3 py-2 rounded cursor-pointer select-none transition-colors"
    :class="[
      disabled
        ? 'text-gray-400 cursor-not-allowed'
        : isActive
        ? 'bg-blue-50 text-blue-700 font-medium'
        : 'text-gray-700 hover:bg-gray-100',
    ]"
    @click="navigate"
  >
    <!-- Icon -->
    <span v-if="icon" class="text-base">
      {{ icon }}
    </span>

    <!-- Label -->
    <span class="truncate">
      {{ label }}
    </span>
  </div>
</template>
