<script setup lang="ts">
type Issue = {
  id: number;
  title: string;
  type: string;
  assigneeName?: string | null;
  statusId: number;
};
const props = defineProps<{ issue: Issue }>();

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData("text/plain", String(props.issue.id));
  e.dataTransfer?.setData(
    "application/x-kanban-issue",
    JSON.stringify({ id: props.issue.id })
  );
  e.dataTransfer!.effectAllowed = "move";
}
</script>

<template>
  <div
    class="bg-background rounded-lg border p-3 shadow-sm cursor-move"
    draggable="true"
    @dragstart="onDragStart"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="text-sm font-medium truncate">{{ issue.title }}</p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ issue.type }} • {{ issue.assigneeName || "Unassigned" }}
        </p>
      </div>
      <span class="text-xs text-muted-foreground">#{{ issue.id }}</span>
    </div>
  </div>
</template>
