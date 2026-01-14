<script setup lang="ts">
import KanbanIssueCard from "@/components/KanbanIssueCard.vue";
import { useAuthStore } from "@/stores/auth.store";
import { UserRoleEnum } from "@/types/role";
import { hasRole } from "@/utils/permission";
import { EditIcon, TrashIcon } from "lucide-vue-next";
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

const emit = defineEmits<{
  (e: "drop-issue", payload: { issueId: number; toStatusId: number }): void;
  (e: "rename", status: BoardStatus): void;
  (e: "delete", statusId: BoardStatus["id"]): void;
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

  emit("drop-issue", { issueId, toStatusId: props.status.id });
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
      <KanbanIssueCard v-for="it in issues" :key="it.id" :issue="it" />
      <div
        v-if="issues.length === 0"
        class="text-xs text-muted-foreground py-4 text-center"
      >
        Drop issues here
      </div>
    </div>
  </div>
</template>
