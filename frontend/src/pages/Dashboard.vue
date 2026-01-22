<script setup lang="ts">
import ProjectCard from "../components/ProjectCard.vue";
import IssueList from "../components/IssueList.vue";
import { type ProjectInterface } from "../types/project";
import { onMounted, ref } from "vue";
import { type IssueType } from "@/types/issue";
import { ForYouService } from "@/api/for-you.api";
import { formatRelativeDate } from "@/utils/time";

const loading = ref(false);
const error = ref<string | null>(null);

const aiEnabled = ref(false);
const aiText = ref("");

const issues = ref<IssueType[]>([]);
const projects = ref<ProjectInterface[]>([]);

const load = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data: response, status} = await ForYouService.get();
    if(status === 200){
      console.log(response);
      const result = response.data;
      issues.value = result.recentTasks ?? [];
      projects.value = result.recentProjects ?? [];
      aiEnabled.value = !!result.ai?.enabled;
      aiText.value = result.ai?.text || "";

    }
  } catch (e: any) {
    error.value = e?.message ?? "Load failed";
  } finally {
    loading.value = false;
  }
}

onMounted(async ()=>{
  await load();
})
</script>
<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">For you</h1>

    <div class="p-6 space-y-4">
      <div>
        <p class="text-sm text-muted-foreground">
          Quick summary based on your recent work
        </p>
      </div>

      <div v-if="loading" class="text-sm text-muted-foreground">Loading...</div>
      <div v-else-if="error" class="text-sm text-destructive">{{ error }}</div>
      <div v-else class="grid grid-cols-12 gap-4">
        <!-- AI Summary -->
        <div class="col-span-12 lg:col-span-7 rounded-xl border bg-background p-4">
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-semibold">AI Summary</h2>
            <span class="text-xs px-2 py-0.5 rounded border">
              {{ aiEnabled ? "Ollama On" : "Ollama Off" }}
            </span>
          </div>

          <div
            v-if="aiEnabled && aiText"
            class="text-sm whitespace-pre-wrap leading-relaxed"
          >
            {{ aiText }}
          </div>

          <div v-else class="text-sm text-muted-foreground">
            AI summary unavailable. (Check Ollama is running)
          </div>
        </div>
        <!-- End AI Summary -->

        <!-- Recent Projects -->
        <div class="col-span-12 lg:col-span-5 rounded-xl border bg-background p-4">
          <h2 class="font-semibold mb-2">Recent Projects</h2>
          <div class="space-y-2">
            <button
              v-for="p in projects"
              :key="p.projectKey"
              class="w-full text-left rounded-lg border p-3 hover:bg-muted"
            >
              <router-link :to="`/${p.type}/board/${p.projectKey}`">
                <div class="flex items-center justify-between">
                  <div class="font-medium truncate">{{ p.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ p.projectKey }}</div>
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  {{ String(p.type).toUpperCase() }} • Lead: {{ p.leadUserName || "—" }} •
                  Updated: {{ formatRelativeDate(p.updatedAt || p.createdAt || "") }}
                </div>
              </router-link>
            </button>

            <div v-if="projects.length === 0" class="text-sm text-muted-foreground">
              No recent projects.
            </div>
          </div>
        </div>
        <!-- End recent project -->

        <!-- Recent Tasks -->
        <div class="col-span-12 rounded-xl border bg-background p-4">
          <h2 class="font-semibold mb-2">Recent Tasks</h2>

          <div class="divide-y">
            <div
              v-for="t in issues"
              :key="t.id"
              class="py-3 flex items-start justify-between gap-3"
            >
              <div class="min-w-0">
                <div class="font-medium truncate">
                  {{ t.title }}
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  {{ t.projectKey }} • {{ t.type }} • {{ t.priority }} • Updated:
                  {{ formatRelativeDate(t.updatedAt || t.createdAt || "") }}
                </div>
              </div>

              <span class="text-xs px-2 py-1 rounded bg-muted shrink-0">
                #{{ t.id }}
              </span>
            </div>

            <div v-if="issues.length === 0" class="text-sm text-muted-foreground py-3">
              No recent tasks.
            </div>
          </div>
        </div>
        <!-- End recent tasks -->
      </div>
    </div>
  </div>
</template>
