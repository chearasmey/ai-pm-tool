<script setup lang="ts">
import { ArrowUpRightFromSquare } from "lucide-vue-next";
import type { ProjectInterface } from "../types/project";

defineProps<{
  project: ProjectInterface;
}>();
</script>
<template>
  <div class="min-w-87.5 p-4 bg-white border rounded shadow-sm">
    <div class="flex justify-between gap-3 font-medium text-nowrap truncate">
      {{ project.name }}
      <div>
        <router-link :to="`/${project.type}/board/${project.projectKey}`">
          <ArrowUpRightFromSquare class="w-4 hover:text-blue-600" />
        </router-link>
      </div>
    </div>
    <div class="text-xs text-gray-500">{{ project.type.toLocaleUpperCase() }}</div>

    <div class="mt-3 text-xs text-gray-600">
      Project Lead: {{ project.leadUserName || "N/A" }}
    </div>
  </div>
</template>
