<script setup lang="ts">
import ProjectCard from "../components/ProjectCard.vue";
import IssueList from "../components/IssueList.vue";
import { type ProjectInterface } from "../types/project";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { type IssueType } from "@/types/issue";
import { ForYouService } from "@/api/for-you.api";
import { formatRelativeDate } from "@/utils/time";
import MarkdownViewer from "@/components/MarkdownViewer.vue";
import { streamSseWithBearer } from "@/api/ai-stream.service";
import { useAuthStore } from "@/stores/auth.store";

const auth = useAuthStore();

const isLoadingData = ref(false);
const errorData = ref<string | null>(null);

// AI stream state
const aiText = ref("");
const aiStreaming = ref(false);
const aiError = ref<string | null>(null);
let streamStopper: {stop: () => void } | null = null;

const issues = ref<IssueType[]>([]);
const projects = ref<ProjectInterface[]>([]);

const startAiStream = async () => {
  // stop previous
  streamStopper?.stop();
  streamStopper = null;

  // reset
  aiText.value = "";
  aiError.value = null;
  aiStreaming.value = true;

  // If accessToken may expire, refresh first (optional best practice)
  // await auth.ensureFreshAccessToken();

  streamStopper = await streamSseWithBearer("/api/for-you/ai-stream", auth.$state.accessToken!, {
    onDelta: (delta) => {
      aiText.value += delta; // token-by-token / word-by-word effect
    },
    onDone: () => {
      aiStreaming.value = false;
    },
    onError: (msg) => {
      aiStreaming.value = false;
      aiError.value = msg;
    }
  });

}

const loadData = async () => {
  isLoadingData.value = true;
  errorData.value = null;
  try {
    const { data: response, status} = await ForYouService.get();
    if(status === 200){
      const result = response.data;
      issues.value = result.recentTasks ?? [];
      projects.value = result.recentProjects ?? [];
    }
  } catch (e: any) {
    errorData.value = e?.message ?? "Load failed";
  } finally {
    isLoadingData.value = false;
  }
}

onMounted(async ()=>{
   // 1) show projects/tasks immediately
  await loadData();

  // 2) start AI streaming (user can see data already)
  startAiStream();
})

onBeforeUnmount(() => {
  streamStopper?.stop();
});
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

      <div v-if="isLoadingData" class="text-sm text-muted-foreground">Loading...</div>
      <div v-else-if="errorData" class="text-sm text-destructive">{{ errorData }}</div>
      <div v-else class="grid grid-cols-12 gap-4">
        <!-- AI Summary -->
        <div class="col-span-12 lg:col-span-7 rounded-xl border bg-background p-4">
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-semibold">AI Summary</h2>
            <span class="text-xs px-2 py-0.5 rounded border">
              {{ aiStreaming ? "Thinking..." : "Ready" }}
            </span>
            <button
              class="text-xs px-2 py-1 rounded border hover:bg-muted"
              @click="startAiStream"
            >
              Regenerate
            </button>
          </div>

          <div
            v-if="aiError"
            class="text-sm text-destructive border rounded p-3 bg-destructive/5 border-destructive/20"
          >
            {{ aiError }}
          </div>

          <div v-else class="text-sm text-muted-foreground">
            <markdown-viewer :content="aiText || 'Generating suggestions...'" />
            <!-- typing cursor -->
            <span v-if="aiStreaming" class="inline-block w-2 animate-pulse">▍</span>
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
