<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type Issue = {
  id: number;
  title: string;
  type: string;
  assigneeName?: string | null;
  statusId: number;
};
const props = defineProps<{ issue: Issue }>();
const emit = defineEmits<{
  (e: "view", issueId: number): void;
  (e: "remove", issueId: number): void;
}>();

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData("text/plain", String(props.issue.id));
  e.dataTransfer?.setData(
    "application/x-kanban-issue",
    JSON.stringify({ id: props.issue.id, statusId: props.issue.statusId })
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
      
      <div class="text-xs text-muted-foreground">
        <DropdownMenu>
          <DropdownMenuTrigger
            class="flex flex-col justify-center font-bold hover:bg-gray-200 px-2 pb-2 rounded-sm"
            title="More actions"
            >...</DropdownMenuTrigger
          >
          <DropdownMenuContent>
            <DropdownMenuItem @click="emit('view', issue.id)">
              View/Edit
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('remove', issue.id)"> Remove </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span>#{{ issue.id }}</span>
      </div>
    </div>
  </div>
</template>
