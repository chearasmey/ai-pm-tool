<script setup lang="ts">
type Issue = {
  id: number;
  title: string;
  type: any;
  priority: any;
  statusId: number;
  assigneeName?: string | null;
  sprintId: number | null;
};

const props = defineProps<{
  issue: Issue;
  fromSprintId: number | null; // null if from backlog, sprint.id if from sprint
}>();

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData("text/plain", String(props.issue.id));
  e.dataTransfer?.setData(
    "application/x-scrum-issue",
    JSON.stringify({ issueId: props.issue.id, fromSprintId: props.fromSprintId })
  );
  e.dataTransfer!.effectAllowed = "move";
}
</script>

<template>
  <div
    class="bg-background border rounded-lg p-3 shadow-sm cursor-move hover:shadow transition"
    draggable="true"
    @dragstart="onDragStart"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="text-sm font-medium truncate">{{ issue.title }}</p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ issue.type }} • {{ issue.priority }} •
          {{ issue.assigneeName || "Unassigned" }}
        </p>
      </div>
      <span class="text-xs text-muted-foreground">#{{ issue.id }}</span>
    </div>
  </div>
</template>
