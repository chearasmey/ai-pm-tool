<script setup lang="ts">
import { useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();

/**
 * Choose layout based on route meta
 */
const layout = computed(() => {
  return route.meta.layout || "default";
});
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
</template>
