<script setup lang="ts">
import type { ProjectType } from "../types/project";

defineProps<{
  project: ProjectType;
}>();
</script>
<template>
  <div class="min-w-60 p-4 bg-white border rounded shadow-sm">
    <div class="font-medium text-nowrap truncate">{{ project.name }}</div>
    <div class="text-xs text-gray-500">{{ project.type }} project</div>

    <div class="mt-3 text-xs text-gray-600">My open work items: {{ project.open }}</div>
  </div>
</template>
