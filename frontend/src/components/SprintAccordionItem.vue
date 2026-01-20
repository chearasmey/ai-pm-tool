<script setup lang="ts">
import { computed, ref } from "vue";
import ScrumIssueCard from "./ScrumIssueCard.vue";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import DeleteSprintDialog from "./DeleteSprintDialog.vue";
import UpdateSprintDialog from "./UpdateSprintDialog.vue";

type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE";
type Status = { id: number; name: string; category: StatusCategory; position: number };

type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";
type Sprint = { id: number; name: string; status: SprintStatus };

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
  defineProps<{
    sprint: Sprint;
    issues: Issue[];
    statuses: Status[];
    open: boolean;
    isPermission?: boolean;
  }>(),
  {
    isPermission: true,
  }
);

const emit = defineEmits<{
  (e: "toggle"): void;
  (e: "drop-to-sprint", payload: { issueId: number; sprintId: number }): void;
  (e: "start-sprint"): void;
  (e: "deleted"):void;
  (e: "updated"):void;
}>();

const isShowDeleteSprint = ref(false);
const isShowUpdateSprint = ref(false);

function onDragOver(e: DragEvent) {
  e.preventDefault();
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const raw = e.dataTransfer?.getData("text/plain");
  if (!raw) return;
  const issueId = Number(raw);

  emit("drop-to-sprint", {
    issueId,
    sprintId: props.sprint.id,
  });
}

// Map statusId -> category
const categoryByStatusId = computed(() => {
  const map: Record<number, StatusCategory> = {};
  for (const s of props.statuses) map[s.id] = s.category;
  return map;
});

// counts (use category: TODO, IN_PROGRESS, DONE)
const counts = computed(() => {
  let notStarted = 0;
  let inProgress = 0;
  let completed = 0;

  for (const it of props.issues) {
    const cat = categoryByStatusId.value[it.statusId] ?? "TODO";
    if (cat === "TODO") notStarted++;
    else if (cat === "IN_PROGRESS") inProgress++;
    else completed++;
  }

  return { notStarted, inProgress, completed };
});

</script>

<template>
  <div
    class="rounded-xl border bg-background overflow-hidden"
    :class="{ 'border-2 border-green-600': sprint.status === 'ACTIVE' }"
  >
    <!-- Header -->
    <div class="w-full px-4 py-3 flex items-center justify-between border-b hover:bg-muted/40">
      <div class="flex items-center gap-3 hover:cursor-pointer" @click="emit('toggle')">
        <div class="font-semibold">{{ sprint.name }}</div>

        <!-- badges -->
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-0.5 rounded bg-muted"
            >Not started: {{ counts.notStarted }}</span
          >
          <span class="text-xs px-2 py-0.5 rounded bg-muted"
            >In progress: {{ counts.inProgress }}</span
          >
          <span class="text-xs px-2 py-0.5 rounded bg-muted"
            >Completed: {{ counts.completed }}</span
          >
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs px-2 py-0.5 rounded border">{{ sprint.status }}</span>
        <Button
          v-if="sprint.status === 'PLANNED' && isPermission"
          variant="outline"
          @click.stop="emit('start-sprint')"
        >
          Start sprint
        </Button>
        <DropdownMenu v-if="sprint.status === 'PLANNED' && isPermission">
          <DropdownMenuTrigger
            class="flex flex-col justify-center font-bold hover:bg-gray-200 px-2 pb-2 rounded-sm"
            title="More actions"
            >...</DropdownMenuTrigger
          >
          <DropdownMenuContent>
            <DropdownMenuItem @click="isShowUpdateSprint = true">
              <router-link :to="`#`">Edit</router-link>
            </DropdownMenuItem>
            <DropdownMenuItem @click="isShowDeleteSprint = true">
              <router-link :to="`#`">Delete</router-link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Content -->
    <div v-show="open" class="p-4" @dragover="onDragOver" @drop="onDrop">
      <div class="space-y-2 min-h-15">
        <ScrumIssueCard
          v-for="it in issues"
          :key="it.id"
          :issue="it"
          :fromSprintId="sprint.id"
        />
        <div
          v-if="issues.length === 0"
          class="text-xs text-muted-foreground py-3 text-center"
        >
          Drop issues here to move them into this sprint
        </div>
      </div>
    </div>
  </div>

  <DeleteSprintDialog :open="isShowDeleteSprint" @close="isShowDeleteSprint = false" :sprint="sprint" @deleted="emit('deleted');isShowDeleteSprint = false" />
  <UpdateSprintDialog :sprint="sprint" :open="isShowUpdateSprint" @close="isShowUpdateSprint = false" @updated="emit('updated');isShowUpdateSprint = false" />
</template>
