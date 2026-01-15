<script setup lang="ts">
import KanbanIssueCard from "@/components/KanbanIssueCard.vue";
import { useAuthStore } from "@/stores/auth.store";
import { UserRoleEnum } from "@/types/role";
import { hasRole } from "@/utils/permission";
import { EditIcon, TrashIcon } from "lucide-vue-next";
import RemoveIssueDialog from "./RemoveIssueDialog.vue";
import { ref } from "vue";
import { toastStore } from "./ui/toast/toast.store";
type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE";
type BoardStatus = {
  id: number;
  name: string;
  category: StatusCategory;
  position: number;
};
type Issue = {
  id: number;
  title: string;
  type: string;
  assigneeName?: string | null;
  statusId: number;
};

const props = defineProps<{
  status: BoardStatus;
  issues: Issue[];
}>();

const auth = useAuthStore();
const issueIdToRemove = ref<number | null>(null);
  
const emit = defineEmits<{
  (e: "drop-issue", payload: { issueId: number; currentStatusId: number; toStatusId: number }): void;
  (e: "rename", status: BoardStatus): void;
  (e: "delete", statusId: BoardStatus["id"]): void;
  (e: "view", issueId: number): void;
  (e: "isRemovedIssue"): void;
}>();

function onDragOver(e: DragEvent) {
  e.preventDefault();
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const raw = e.dataTransfer?.getData("text/plain");
  if (!raw) return;
  const issueId = Number(raw);
  if (!Number.isFinite(issueId)) return;
  const statusData = e.dataTransfer?.getData("application/x-kanban-issue");
  if (!statusData) return;

  const parsedStatusData = JSON.parse(statusData);
  emit("drop-issue", { issueId, currentStatusId: parsedStatusData.statusId, toStatusId: props.status.id });
}

function handleViewIssue(issueId: number) {
  emit("view", issueId);
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
  emit("isRemovedIssue");
}
</script>

<template>
  <div
    class="min-w-[320px] max-w-[320px] bg-muted/60 rounded-xl p-3"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <h3 class="font-semibold">{{ status.name }}</h3>
        <div class="flex justify-center items-center w-6 h-6 rounded-sm bg-gray-200 text-sm text-gray-500 font-bold">{{ issues.length }}</div>
        <span
          v-if="status.category === 'DONE'"
          class="text-xs px-2 py-0.5 rounded bg-green-600/10 text-green-700"
        >
          Done
        </span>
      </div>

      <div
        v-if="hasRole(auth.user?.role!, [UserRoleEnum.SYSTEM_ADMIN, UserRoleEnum.PROJECT_ADMIN])"
        class="flex gap-1"
      >
        <button
          class="text-xs py-1 rounded hover:bg-muted"
          @click="emit('rename', status)"
          title="Edit"
        >
          <EditIcon class="w-6 h-6 p-1 text-blue-800 hover:bg-gray-200 hover:rounded-sm" />
        </button>
        <button
          class="text-xs py-1 rounded hover:bg-muted"
          @click="emit('delete', status.id)"
          title="Remove"
        >
          <TrashIcon class="w-6 h-6 p-1 text-red-600 hover:bg-gray-200 hover:rounded-sm" />
        </button>
      </div>
    </div>

    <div class="space-y-2 min-h-30">
      <KanbanIssueCard v-for="it in issues" :key="it.id" :issue="it" @view="handleViewIssue" @remove="handleRemoveIssue" />
      <div
        v-if="issues.length === 0"
        class="text-xs text-muted-foreground py-4 text-center"
      >
        Drop issues here
      </div>
    </div>
  </div>
  <RemoveIssueDialog :issue-id="issueIdToRemove" :open="!!issueIdToRemove" @close="issueIdToRemove = null" :issue-title="issueTitleById(issueIdToRemove!)" @deleted="handleDeletedIssue" />
</template>
