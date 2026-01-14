<script setup lang="ts">
import { computed, reactive, watch } from "vue";

type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE";
type BoardStatus = {
  id: number;
  name: string;
  category: StatusCategory;
  position: number;
};

const props = defineProps<{ open: boolean; status: BoardStatus | null }>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: { statusId: number; name: string }): void;
}>();

const form = reactive({ name: "" });

watch(
  () => props.status,
  (s) => {
    form.name = s?.name ?? "";
  },
  { immediate: true }
);

const canSubmit = computed(() => !!props.status && !!form.name.trim());

function submit() {
  if (!props.status) return;
  const name = form.name.trim();
  if (!name) return;
  emit("submit", { statusId: props.status.id, name });
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
    <div
      class="absolute left-1/2 top-1/2 w-105 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background p-5 border shadow"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold">Rename</h2>
        <button
          class="text-sm text-muted-foreground hover:text-foreground"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-medium">Name</label>
        <input
          v-model="form.name"
          class="w-full border rounded px-3 py-2 bg-background"
          placeholder="New name"
        />
        <p
          v-if="props.status?.category === 'DONE'"
          class="text-xs text-muted-foreground mt-1"
        >
          This is a Done category column and will stay on the far right.
        </p>
      </div>

      <div class="flex justify-end gap-2 mt-5">
        <button class="px-3 py-2 rounded border hover:bg-muted" @click="emit('close')">
          Cancel
        </button>
        <button
          class="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
          :disabled="!canSubmit"
          @click="submit"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>
