<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import { SemanticAdminService } from "@/api/semantic.service";
import { UserRoleEnum } from "@/types/role";

// If you already have toast, use it; otherwise replace with alert().
const auth = useAuthStore();

const isSystemAdmin = computed(() => auth.user?.role === UserRoleEnum.SYSTEM_ADMIN);

const loading = ref(false);
const result = ref<any | null>(null);
const error = ref<string | null>(null);

async function run() {
  loading.value = true;
  error.value = null;
  result.value = null;

  try {
    const {data: response, status} = await SemanticAdminService.reindex();
    if(status===200){
      result.value = response.data;
    }
  } catch (e: any) {
    error.value = e?.message || "Failed to rebuild index";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div v-if="isSystemAdmin" class="rounded-xl border p-4 bg-background space-y-3">
    <div class="flex items-center justify-between">
      <div>
        <div class="font-semibold">Semantic Index</div>
        <div class="text-xs text-muted-foreground">
          Rebuild embeddings for projects and issues (Ollama).
        </div>
      </div>

      <button
        class="px-3 py-2 rounded-lg border hover:bg-muted text-sm"
        :disabled="loading"
        @click="run"
      >
        {{ loading ? "Rebuilding..." : "Rebuild semantic index" }}
      </button>
    </div>

    <div v-if="error" class="text-sm text-destructive">
      {{ error }}
    </div>

    <div v-if="result" class="text-sm">
      <div class="text-xs text-muted-foreground mb-2">
        Model: {{ result.model }} • Started: {{ result.startedAt }} • Finished:
        {{ result.finishedAt }}
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div class="rounded border p-2">
          <div class="font-medium">Projects</div>
          <div class="text-xs text-muted-foreground">
            total={{ result.projects.total }}, updated={{ result.projects.updated }},
            skipped={{ result.projects.skipped }}
          </div>
        </div>

        <div class="rounded border p-2">
          <div class="font-medium">Issues</div>
          <div class="text-xs text-muted-foreground">
            total={{ result.issues.total }}, updated={{ result.issues.updated }},
            skipped={{ result.issues.skipped }}
          </div>
        </div>
      </div>

      <div class="mt-3 rounded border p-2 bg-muted/20">
        <div class="text-xs font-semibold mb-1">Logs</div>
        <ul class="text-xs text-muted-foreground space-y-1 max-h-48 overflow-auto">
          <li v-for="(l, i) in result.logs" :key="i">{{ l }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>
