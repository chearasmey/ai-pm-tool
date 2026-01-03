<script setup lang="ts">
import type { IssueType } from '../types/issue';

defineProps<{
    issue: IssueType
}>()
</script>
<template>
  <div class="bg-white p-3 rounded shadow-sm mb-2 cursor-pointer">
    <div class="text-xs text-gray-500">{{ issue.key }}</div>
    <div class="text-sm font-medium">{{ issue.title }}</div>

    <div class="flex justify-between mt-2">
      <span class="text-xs">{{ issue.type }}</span>
      <img alt="Assignee Avatar" class="w-6 h-6 rounded-full" :src="issue.assigneeAvatar" />
    </div>
  </div>
</template>
