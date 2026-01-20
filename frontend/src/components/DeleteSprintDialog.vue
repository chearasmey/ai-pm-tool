<script setup lang="ts">
import { SprintService } from "@/api/sprint.api";
import { formatDateTime, formatRelativeDate } from "@/utils/time";
import { ref } from "vue";

type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

type Sprint = {
  id: number;
  name: string;
  status: SprintStatus;
  startDate?: string | null;
  endDate?: string | null;
  goal?: string | null;
  updatedAt?: string | null;
};
const props = defineProps<{
  open: boolean;
  sprint: Sprint;
}>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "deleted"): void;
}>();

const errorMsg = ref<string | null>(null);
const isSubmitting = ref(false);

const onDeleteSprint = async () => {
  isSubmitting.value = true;
  const { status } = await SprintService.delete(props.sprint.id);
  if (status === 200) {
    isSubmitting.value = false;
    emit("deleted");
  }
};

const onClose = async () => {
  emit("close");
};
</script>
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="onClose" />

    <div
      class="absolute left-1/2 top-1/2 w-115 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background border shadow p-5"
    >
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Delete Sprint</h2>
        <button
          class="text-sm text-muted-foreground hover:text-foreground"
          @click="onClose"
        >
          ✕
        </button>
      </div>

      <div v-if="!sprint" class="text-sm text-muted-foreground">
        No active sprint selected.
      </div>

      <div v-else class="space-y-3">
        <div class="rounded-lg border p-3 bg-muted/40">
          <p class="text-sm">
            You are about to delete:
            <span class="font-semibold">{{ sprint.name }}</span>
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            Start: <span class="font-medium">{{ formatDateTime(sprint.startDate) }}</span>
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            End: <span class="font-medium">{{ formatDateTime(sprint.endDate) }}</span>
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            Updated: <span class="font-medium">{{ formatRelativeDate(sprint.updatedAt!) }}</span>
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
          @click="onClose"
        >
          Cancel
        </button>

        <button
          class="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50"
          :disabled="!sprint"
          @click="onDeleteSprint"
        >
          {{ isSubmitting ? "Deleting..." : "Delete" }}
        </button>
      </div>
    </div>
  </div>
</template>
