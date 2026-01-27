<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { SearchService, type SearchResult, type SuggestItem } from "@/api/search.api";
import { debounce } from "@/utils/debounce";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { bus } from "@/events/bus";

const router = useRouter();
const auth = useAuthStore();

const open = ref(false);
const q = ref("");

const loadingSuggest = ref(false);
const loadingSearch = ref(false);
const error = ref<string | null>(null);

const suggestions = ref<SuggestItem[]>([]);
const results = ref<SearchResult[]>([]);
const activeIndex = ref(0);

const types = ref<string>("PROJECT,ISSUE");

const flattened = computed(() => {
  const items: Array<{ kind: "SUGGEST" | "RESULT"; item: any }> = [];
  for (const s of suggestions.value) items.push({ kind: "SUGGEST", item: s });
  for (const r of results.value) items.push({ kind: "RESULT", item: r });
  return items;
});

function reset() {
  suggestions.value = [];
  results.value = [];
  activeIndex.value = 0;
  error.value = null;
}

function close() {
  open.value = false;
  q.value = "";
  reset();
}

function openDialog(initialQuery?: string) {
  open.value = true;
  q.value = initialQuery ?? "";
  reset();

  requestAnimationFrame(() => {
    const el = document.getElementById("global-search-input") as HTMLInputElement | null;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  });
}

function routeToProject(projectKey: string, projectType: string) {
  const t = String(projectType || "").toLowerCase();
  if (t === "scrum") return `/scrum/board/${projectKey}`;
  if (t === "kanban") return `/kanban/board/${projectKey}`;
  // fallback
  return `/projects/${projectKey}`;
}

function goToResult(r: SearchResult) {
  if (r.entityType === "PROJECT") {
    router.push(routeToProject(r.projectKey, r.projectType));
    close();
    return;
  }

  // ISSUE: route to project page (based on project type) + open issue
  // Pick one of these approaches:

  // ✅ Approach A: go to project and pass issueId as query (recommended for "open issue dialog")
  router.push({
    path: routeToProject(r.projectKey, r.projectType),
    query: { issueId: String(r.issueId) }
  });

  // ✅ OR Approach B: if you have a direct issue route, keep it but still need projectType:
  // router.push(`/projects/${r.projectKey}/issues/${r.issueId}`);

  close();
}

function useSuggestion(s: SuggestItem) {
  q.value = s.value;
  triggerSearch();
}

const triggerSuggest = debounce(async () => {
  const query = q.value.trim();
  if (!query) {
    suggestions.value = [];
    return;
  }
  loadingSuggest.value = true;
  error.value = null;
  try {
    const res = await SearchService.suggest(query, 10);
    suggestions.value = res?.suggestions ?? [];
    activeIndex.value = 0;
  } catch (e: any) {
    error.value = e?.message ?? "Suggest error";
  } finally {
    loadingSuggest.value = false;
  }
}, 250);

const triggerSearch = debounce(async () => {
  const query = q.value.trim();
  if (!query) {
    results.value = [];
    return;
  }
  loadingSearch.value = true;
  error.value = null;
  try {
    const res = await SearchService.globalSearch(query, {
      limit: 20,
      types: types.value
    });
    results.value = res?.results ?? [];
  } catch (e: any) {
    error.value = e?.message ?? "Search error";
  } finally {
    loadingSearch.value = false;
  }
}, 300);

watch(q, () => {
  triggerSuggest();
  triggerSearch();
});

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return;

  if (e.key === "Escape") {
    e.preventDefault();
    close();
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex.value = Math.min(flattened.value.length - 1, activeIndex.value + 1);
    return;
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex.value = Math.max(0, activeIndex.value - 1);
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    const active = flattened.value[activeIndex.value];
    if (!active) return;

    if (active.kind === "SUGGEST") useSuggestion(active.item as SuggestItem);
    else goToResult(active.item as SearchResult);
  }
}

function globalShortcut(e: KeyboardEvent) {
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

  if (cmdOrCtrl && e.key.toLowerCase() === "k") {
    e.preventDefault();
    bus.emit("search:open", { initialQuery: "" });
  }
}

function onBusOpen(payload?: { initialQuery?: string }) {
  openDialog(payload?.initialQuery);
}

function onBusClose() {
  close();
}

onMounted(() => {
  globalThis.addEventListener("keydown", globalShortcut);
  globalThis.addEventListener("keydown", onKeydown);

  bus.on("search:open", onBusOpen);
  bus.on("search:close", onBusClose);
});

onBeforeUnmount(() => {
  globalThis.removeEventListener("keydown", globalShortcut);
  globalThis.removeEventListener("keydown", onKeydown);

  bus.off("search:open", onBusOpen);
  bus.off("search:close", onBusClose);
});
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="close"></div>

    <div
      class="absolute left-1/2 top-16 w-[720px] max-w-[92vw] -translate-x-1/2 rounded-xl border bg-background shadow-lg"
    >
      <div class="p-3 border-b">
        <input
          id="global-search-input"
          v-model="q"
          class="w-full px-3 py-2 rounded-lg border bg-background outline-none"
          placeholder="Search issues and projects..."
          autocomplete="off"
        />
        <div class="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{{
            loadingSuggest || loadingSearch ? "Searching..." : "Type to search"
          }}</span>
          <span>Enter to open • Esc to close</span>
        </div>
        <div v-if="error" class="mt-2 text-xs text-destructive">{{ error }}</div>
      </div>

      <div class="max-h-[420px] overflow-auto">
        <!-- Suggestions -->
        <div v-if="suggestions.length" class="p-2">
          <div class="text-xs font-semibold text-muted-foreground px-2 py-1">
            Suggestions
          </div>

          <button
            v-for="(s, i) in suggestions"
            :key="s.value + i"
            class="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center justify-between"
            :class="activeIndex === i ? 'bg-muted' : ''"
            @click="useSuggestion(s)"
          >
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">{{ s.label }}</div>
              <div class="text-[11px] text-muted-foreground">{{ s.source }}</div>
            </div>
            <span class="text-xs text-muted-foreground">↵</span>
          </button>
        </div>

        <!-- Results -->
        <div v-if="results.length" class="p-2 border-t">
          <div class="text-xs font-semibold text-muted-foreground px-2 py-1">Results</div>

          <button
            v-for="r in results"
            :key="r.entityType === 'PROJECT' ? 'p-' + r.projectKey : 'i-' + (r as any).issueId"
            class="w-full text-left px-3 py-2 rounded-lg hover:bg-muted"
            :class="
              activeIndex === suggestions.length + results.indexOf(r) ? 'bg-muted' : ''
            "
            @click="goToResult(r)"
          >
            <template v-if="r.entityType === 'PROJECT'">
              <div class="flex items-center justify-between">
                <div class="font-medium truncate">{{ r.name }}</div>
                <div class="text-xs text-muted-foreground">{{ r.projectKey }}</div>
              </div>
              <div class="text-xs text-muted-foreground line-clamp-2">
                {{ r.description || "—" }}
              </div>
            </template>

            <template v-else>
              <div class="flex items-center justify-between">
                <div class="font-medium truncate">{{ (r as any).title }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ (r as any).projectKey }} • {{ (r as any).issueType }}
                </div>
              </div>
              <div
                class="text-xs text-muted-foreground flex items-center justify-between gap-2"
              >
                <span class="truncate">{{ (r as any).description || "—" }}</span>
                <span class="shrink-0 px-2 py-0.5 rounded bg-muted text-[11px]">
                  {{ (r as any).status || "—" }}
                </span>
              </div>
            </template>
          </button>
        </div>

        <div
          v-if="!suggestions.length && !results.length && q.trim()"
          class="p-4 text-sm text-muted-foreground"
        >
          No results.
        </div>
      </div>

      <div class="p-3 border-t text-xs text-muted-foreground flex justify-between">
        <span>Tip: Ctrl+K anywhere</span>
        <button class="hover:underline" @click="close">Close</button>
      </div>
    </div>
  </div>
</template>
