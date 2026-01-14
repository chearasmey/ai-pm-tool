<script setup lang="ts">
import { BoardStatusService } from "@/api/board-status.api";
import { IssueService } from "@/api/issue.api";
import { computed, onMounted, ref, watch } from "vue";

type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE";

export type BoardStatus = {
  id: number;
  name: string;
  category: StatusCategory;
  position: number;
};

const props = defineProps<{
  open: boolean;
  projectKey: string;
  status: BoardStatus | null; // the column being removed
  statuses: BoardStatus[]; // all statuses in this project
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "removed",
    payload: {
      removedStatusId: number;
      movedIssues: number;
      movedToStatusId: number | null;
    }
  ): void;
}>();

const isSubmitting = ref(false);
const errorMsg = ref<string | null>(null);
const movedIssues = ref<number | null>(null);

// Find a replacement status in same category (exclude self)
// Prefer smallest position (and stable by id)
const replacement = computed(() => {
  if (!props.status) return null;
  const candidates = props.statuses
    .filter((s) => s.category === props.status!.category && s.id !== props.status!.id)
    .sort((a, b) => a.position - b.position || a.id - b.id);
  return candidates[0] ?? null;
});

const canDelete = computed(() => {
  // If there is no replacement in same category, backend will reject when issues exist.
  // We choose to disable delete to prevent a bad UX.
  // If you want to allow delete only if issueCount == 0, you can fetch count here.
  return !!props.status && !!replacement.value;
});

// Optional: fetch issue count to show in dialog (nice UX)
async function fetchIssueCount() {
  if (!props.status) return;
  movedIssues.value = null;
  errorMsg.value = null;

  try {
    const {data: response, status} = await IssueService.countByStatus(props.status.id);
    if (status === 200) {
        movedIssues.value = response.count??0;
    } else {
        return;
    }

  } catch {
    // ignore
  }
}

watch(
  () => props.open,
  (v) => {
    if (v) fetchIssueCount();
    else {
      errorMsg.value = null;
      movedIssues.value = null;
      isSubmitting.value = false;
    }
    
  }
);

async function onConfirmRemove() {
  if (!props.status) return;

  isSubmitting.value = true;
  errorMsg.value = null;

  try {
    const { data: response, status } = await BoardStatusService.deleteBoardStatus(
      props.status.id
    );

    // Your backend returns { movedIssues, movedToStatusId }
    if (status === 200) {
      const data = response.data;

      emit("removed", {
        removedStatusId: props.status.id,
        movedIssues: Number(data?.movedIssues ?? 0),
        movedToStatusId: data?.movedToStatusId ?? null,
      });

      emit("close");
    }
  } catch (e: any) {
    if (e.response) {
      errorMsg.value = e?.response?.data || "Failed to delete column. Please try again.";
    } else if (e.request) {
      errorMsg.value = "No response from server. Please check your network.";
    } else {
      errorMsg.value = "Failed to delete column. Please try again. " + e.message;
    }
  } finally {
    isSubmitting.value = false;
  }
}

function onClose() {
  if (isSubmitting.value) return;
  emit("close");
}

</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="onClose" />

    <div
      class="absolute left-1/2 top-1/2 w-115 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background border shadow p-5"
    >
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Remove column</h2>
        <button
          class="text-sm text-muted-foreground hover:text-foreground"
          @click="onClose"
        >
          ✕
        </button>
      </div>

      <div v-if="!status" class="text-sm text-muted-foreground">No column selected.</div>

      <div v-else class="space-y-3">
        <div class="rounded-lg border p-3 bg-muted/40">
          <p class="text-sm">
            You are about to remove: <span class="font-semibold">{{ status.name }}</span>
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            Category: <span class="font-medium">{{ status.category }}</span>
          </p>
        </div>

        <div class="text-sm space-y-1">
          <p>
            Issues in this column will be moved to:
            <span v-if="replacement" class="font-semibold">
              {{ replacement.name }}
            </span>
            <span v-else class="font-semibold text-destructive">
              (No available column)
            </span>
          </p>

          <p v-if="movedIssues !== null" class="text-xs text-muted-foreground">
            Estimated issues to move: {{ movedIssues }}
          </p>

          <p v-if="!replacement" class="text-xs text-destructive">
            You can’t delete this column because there is no other column in the same
            category to move issues into. Create another column with category
            <span class="font-medium">{{ status.category }}</span> first.
          </p>
        </div>

        <div
          v-if="errorMsg"
          class="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-lg p-3"
        >
          {{ errorMsg }}
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-5">
        <button
          class="px-3 py-2 rounded border hover:bg-muted disabled:opacity-50"
          :disabled="isSubmitting"
          @click="onClose"
        >
          Cancel
        </button>

        <button
          class="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50"
          :disabled="!canDelete || isSubmitting"
          @click="onConfirmRemove"
        >
          {{ isSubmitting ? "Removing..." : "Remove" }}
        </button>
      </div>
    </div>
  </div>
</template>
