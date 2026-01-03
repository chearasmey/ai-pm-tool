<script setup lang="ts">
import IssueCard from "./IssueCard.vue";
const status = {
  name: "In The Last Week",
  issues: [
    {
      id: 1,
      key: "DTADD-2323",
      title: "Join weekly meeting (team lead) & EMS demo",
      type: "Task",
      assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/63a2d1a56f068efec8f512be/1ba98fe4-e067-4812-a769-e8d1af79c909/128",
    },
    {
      id: 2,
      key: "DTADD-2324",
      title: "Review SDD of CCMS v2",
      type: "Task",
      assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/63a2d1a56f068efec8f512be/1ba98fe4-e067-4812-a769-e8d1af79c909/128",
    },
    {
      id: 3,
      key: "DTADD-2325",
      title: "Stand-up meeting",
      type: "Task",
      assigneeAvatar: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/63a2d1a56f068efec8f512be/1ba98fe4-e067-4812-a769-e8d1af79c909/128",
    },
  ],
};
</script>
<template>
  <div class="w-72 bg-gray-100 rounded p-2">
    <h3 class="text-sm font-semibold mb-2 uppercase">{{ status.name }}</h3>

    <IssueCard v-for="issue in status.issues" :key="issue.id" :issue="issue" />
  </div>
</template>
