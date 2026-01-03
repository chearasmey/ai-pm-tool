<script setup lang="ts">
import ProjectCard from "../components/ProjectCard.vue";
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
    <h1 class="text-2xl font-semibold mb-4">Project Starred</h1>

    <!-- Recent Spaces -->
    <section>

      <div class="flex flex-wrap gap-4">
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
      </div>
    </section>
  </div>
</template>
