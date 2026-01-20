<script setup lang="ts">
import { ref } from "vue";
import KanbanIssueCard from "./KanbanIssueCard.vue";
import RemoveIssueDialog from "./RemoveIssueDialog.vue";
import { Button } from "./ui/button";
import { toastStore } from "./ui/toast/toast.store";
import IssueViewDialog from "./IssueViewDialog.vue";

type Issue = {
  id: number;
  title: string;
  type: any;
  priority: any;
  statusId: number;
  assigneeName?: string | null;
  sprintId: number | null;
};

const props = withDefaults(
  defineProps<{ issues: Issue[]; projectKey: string; isPermission?: boolean }>(),
  {
    isPermission: true,
  }
);

const emit = defineEmits<{
  (e: "create-sprint"): void;
  (e: "drop-to-backlog", issueId: number): void;
  (e: "updated"): void;
  (e: "deleted"): void;
}>();

const showIssueView = ref(false);
const issueIdToRemove = ref<number | null>(null);
const issueIdView = ref<number>(0);

function onDragOver(e: DragEvent) {
  e.preventDefault();
}

function onDrop(e: DragEvent) {
  const raw = e.dataTransfer?.getData("text/plain");
  if (!raw) return;
  const issueId = Number(raw);
  emit("drop-to-backlog", issueId);
}

function handleIssueView(issueId: number) {
  issueIdView.value = issueId;
  showIssueView.value = true;
}

function handleUpdatedIssue() {
  showIssueView.value = false;
  emit("updated");
}

function handleRemoveIssue(issueId: number) {
  issueIdToRemove.value = issueId;
}

function issueTitleById(issueId: number): string {
  const issue = props.issues.find((it) => it.id === issueId);
  return issue ? issue.title : "";
}

function handleDeletedIssue(payload: { deletedCount: number; deletedIds: number[] }) {
  toastStore.show(`${payload.deletedCount} issue(s) deleted successfully.`, "success");
  issueIdToRemove.value = null;
  emit("deleted");
}
</script>

<template>
  <div class="rounded-xl border bg-background">
    <div class="flex items-center justify-between px-4 py-3 border-b">
      <div class="flex items-center gap-2">
        <h2 class="font-semibold">Backlog</h2>
        <span class="text-xs px-2 py-0.5 rounded bg-muted">{{ issues.length }}</span>
      </div>

      <Button v-if="isPermission" variant="outline" @click="emit('create-sprint')"> Add sprint </Button>
    </div>

    <!-- Drop zone -->
    <div class="p-4" @dragover="onDragOver" @drop="onDrop">
      <div class="space-y-2 min-h-15">
        <KanbanIssueCard
          v-for="it in issues"
          :key="it.id"
          :issue="it"
          @view="handleIssueView"
          @remove="handleRemoveIssue"
        />
        <div
          v-if="issues.length === 0"
          class="text-xs text-muted-foreground py-3 text-center"
        >
          Drop issues here to move them to backlog
        </div>
      </div>
    </div>
  </div>

  <IssueViewDialog
    :open="showIssueView"
    :project-key="projectKey"
    :issue-id="issueIdView"
    @close="showIssueView = false"
    @updated="handleUpdatedIssue"
  />

  <RemoveIssueDialog
    :issue-id="issueIdToRemove"
    :open="!!issueIdToRemove"
    @close="issueIdToRemove = null"
    :issue-title="issueTitleById(issueIdToRemove!)"
    @deleted="handleDeletedIssue"
  />
</template>
