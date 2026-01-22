<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ProjectCard from "../components/ProjectCard.vue";
import { ProjectFavoriteService } from "@/api/project-favorite.api";
import type { Paginated } from "@/types/general";
import type { StarredProject } from "@/types/project";
const isLoading = ref(false);
const error = ref<string | null>(null);
const items = ref<StarredProject[]>([]);
const page = ref(1);
const limit = Number(import.meta.env.VITE_STARRED_PAGE_LIMIT ?? 20);
const totalPages = ref(1);

const hasMore = computed(() => page.value < totalPages.value);
const scrollElement = ref<HTMLElement | null>(null);

const mergeUnigue = (existing: StarredProject[], incoming: StarredProject[]) => {
  const map = new Map<string, StarredProject>();
  for (const p of existing) map.set(p.projectKey, p);
  for (const p of incoming) map.set(p.projectKey, p);
  const existingKeys = new Set(existing.map((x) => x.projectKey));
  const merged = [...existing];
  for (const p of incoming) {
    if (!existingKeys.has(p.projectKey)) merged.push(p);
  }
  return merged;
};

const loadFirst = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    page.value = 1;
    const starredProject: Paginated<StarredProject> = await ProjectFavoriteService.getProjects(
      {
        page: 1,
        limit,
      }
    );

    items.value = starredProject.items;
    totalPages.value = starredProject.totalPages || 1;
  } catch (e: any) {
    error.value = e?.message ?? "Failed to load starred project";
  } finally {
    isLoading.value = false;
  }
};

const loadNext = async () => {
  if (isLoading.value) return;
  if (!hasMore.value) return;

  isLoading.value = true;
  error.value = null;
  try {
    const nextPage = page.value + 1;
    const starredProject: Paginated<StarredProject> = await ProjectFavoriteService.getProjects(
      {
        page: nextPage,
        limit,
      }
    );

    items.value = mergeUnigue(items.value, starredProject.items);
    totalPages.value = starredProject.totalPages || totalPages.value;
    page.value = starredProject.page;
  } catch (e: any) {
    error.value = e?.message ?? "Failed to load more";
  } finally {
    isLoading.value = false;
  }
};

const onScroll = async () => {
  console.log("scrolled");

  const el = scrollElement.value;
  if (!el) return;
  const threshold = 80;
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  if (nearBottom) await loadNext();
};

onMounted(async () => {
  await loadFirst();
});
</script>
<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">Starred Project</h1>

    <!-- Recent Spaces -->
    <section ref="scrollElement" class="rounded-lg" @scroll="onScroll">
      <div v-if="error" class="text-xs text-destructive p-2">{{ error }}</div>
      <div
        v-if="items.length === 0 && !isLoading"
        class="text-xs text-muted-foreground px-2 py-3"
      >
        No starred projects
      </div>
      <div class="p-1 space-y-1 flex flex-wrap justify-items-start gap-3">
        <ProjectCard
          v-for="project in items"
          :key="project.projectKey"
          :project="project"
        />
      </div>

      <!-- loading / load more indicator -->
      <div class="px-2 py-6 text-center text-xs text-muted-foreground">
        <div v-if="isLoading">Loading...</div>
        <div v-else-if="hasMore" @click="onScroll" class="hover:cursor-pointer">
          Load more
        </div>
        <!-- <div v-else-if="items.length > 0">No more projects</div> -->
      </div>
    </section>
  </div>
</template>
