<script setup lang="ts">
import { IssueService } from "@/api/issue.api";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  open: boolean;
  issueId: number | null;
  issueTitle?: string; // optional, show in dialog
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "deleted", payload: { deletedCount: number; deletedIds: number[] }): void;
}>();

const cascade = ref(true);
const submitting = ref(false);
const errorMsg = ref<string | null>(null);

watch(
  () => props.open,
  (v) => {
    if (v) {
      cascade.value = true;
      submitting.value = false;
      errorMsg.value = null;
    }
  }
);

const canSubmit = computed(() => !!props.issueId && !submitting.value);

async function remove() {
  if (!props.issueId) return;

  submitting.value = true;
  errorMsg.value = null;

  try {
    const {data: response, status} = await IssueService.deleteIssue(props.issueId, cascade.value);
    if (status === 200) {
      emit("deleted", { deletedCount: response.data.deletedCount, deletedIds: response.data.deletedIds });
    } else {
      errorMsg.value = "Failed to delete issue. Please try again.";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')" />

    <div
      class="absolute left-1/2 top-1/2 w-130 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background border shadow p-5"
    >
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Delete issue</h2>
        <button
          class="text-sm text-muted-foreground hover:text-foreground"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="space-y-3">
        <div class="rounded-lg border p-3 bg-destructive/5 border-destructive/20">
          <p class="text-sm font-medium">This action cannot be undone.</p>
          <p v-if="issueTitle" class="text-sm text-muted-foreground mt-1">
            Issue: <span class="font-semibold text-foreground">{{ issueTitle }}</span>
          </p>
        </div>

        <label class="flex items-start gap-3 text-sm">
          <input type="checkbox" v-model="cascade" class="mt-1" />
          <span>
            <span class="font-medium">Also delete children</span>
            <span class="block text-xs text-muted-foreground mt-1">
              If this issue has sub-tasks/child issues, they will be removed too.
            </span>
          </span>
        </label>

        <div
          v-if="errorMsg"
          class="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-lg p-3"
        >
          {{ errorMsg }}
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-5">
        <button
          class="px-3 py-2 rounded border hover:bg-muted"
          @click="emit('close')"
          :disabled="submitting"
        >
          Cancel
        </button>

        <button
          class="px-3 py-2 rounded bg-destructive text-white disabled:opacity-50"
          :disabled="!canSubmit"
          @click="remove"
        >
          {{ submitting ? "Deleting..." : "Delete" }}
        </button>
      </div>
    </div>
  </div>
</template>
