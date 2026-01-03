<script setup lang="ts">
import ProjectCard from "../components/ProjectCard.vue";
import IssueList from "../components/IssueList.vue";
import type { ProjectType } from "../types/project";
const projects:ProjectType[] = [
  {
    id: 1,
    name: 'APD Task Tracking System',
    open: "d",
    type: "Kanban"
  },
  {
    id: 2,
    name: 'EDC Project',
    open: "d",
    type: "Scrum"
  },
  {
    id: 3,
    name: 'System Auto Generation',
    open: "d",
    type: "Scrum"
  }
];
</script>
<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">For you</h1>

    <!-- Recent Spaces -->
    <section>
      <h2 class="text-sm font-medium mb-2">Recent spaces</h2>

      <div class="flex gap-4 overflow-x-auto">
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
      </div>
    </section>

    <!-- Worked On -->
    <section class="mt-8">
      <h2 class="text-sm font-medium mb-2">Worked on</h2>

      <IssueList />
    </section>
  </div>
</template>
