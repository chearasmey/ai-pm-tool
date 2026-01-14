<script setup lang="ts">
import { reactive } from "vue";

type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: { name: string; category: StatusCategory }): void;
}>();

const form = reactive<{ name: string; category: StatusCategory }>({
  name: "",
  category: "IN_PROGRESS",
});

function submit() {
  if (!form.name.trim()) return;
  emit("submit", { name: form.name.trim(), category: form.category });
  form.name = "";
  form.category = "IN_PROGRESS";
  emit("close");
}
</script>

<template>
  <!-- shadcn dialog style (minimal) -->
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
    <div
      class="absolute left-1/2 top-1/2 w-105 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background p-5 border shadow"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold">Add</h2>
        <button
          class="text-sm text-muted-foreground hover:text-foreground"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="space-y-3">
        <div class="space-y-1">
          <label class="text-sm font-medium">Name</label>
          <input
            v-model="form.name"
            class="w-full border rounded px-3 py-2 bg-background"
            placeholder="e.g. Review"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium">Category</label>
          <select
            v-model="form.category"
            class="w-full border rounded px-3 py-2 bg-background"
          >
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </select>
          <p class="text-xs text-muted-foreground">
            Columns in the “Done” category will appear on the far right.
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-5">
        <button class="px-3 py-2 rounded border hover:bg-muted" @click="emit('close')">
          Cancel
        </button>
        <button
          class="px-3 py-2 rounded bg-primary text-primary-foreground"
          @click="submit"
        >
          Create
        </button>
      </div>
    </div>
  </div>
</template>
