<script setup lang="ts">
import { computed, reactive, watch } from "vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void; (e: "submit", payload: any): void }>();

const form = reactive({
  name: "",
  duration: "2w" as "1w" | "2w" | "3w" | "4w" | "custom",
  startDate: "",
  endDate: "",
  goal: "",
});

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    form.name = "";
    form.duration = "2w";
    form.startDate = "";
    form.endDate = "";
    form.goal = "";
  }
);

function addDays(dateISO: string, days: number) {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

watch(
  () => [form.duration, form.startDate],
  () => {
    if (!form.startDate) return;
    if (form.duration === "custom") return;

    const days =
      form.duration === "1w"
        ? 7
        : form.duration === "2w"
        ? 14
        : form.duration === "3w"
        ? 21
        : 28;

    // datetime-local -> ISO
    const startISO = new Date(form.startDate).toISOString();
    form.endDate = new Date(addDays(startISO, days)).toISOString().slice(0, 16); // to datetime-local
  }
);

const canSubmit = computed(
  () => form.name.trim().length >= 2 && !!form.startDate && !!form.endDate
);

function submit() {
  if (!canSubmit.value) return;
  emit("submit", {
    name: form.name.trim(),
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString(),
    goal: form.goal.trim() || null,
  });
  emit("close");
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
    <div
      class="absolute left-1/2 top-1/2 w-130 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background border shadow p-5"
    >
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Create sprint</h2>
        <button
          class="text-sm text-muted-foreground hover:text-foreground"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="space-y-3">
        <div class="space-y-1">
          <label class="text-sm font-medium">Sprint name</label>
          <input
            v-model="form.name"
            class="w-full border rounded px-3 py-2 bg-background"
            placeholder="Sprint 1"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-sm font-medium">Duration</label>
            <select
              v-model="form.duration"
              class="w-full border rounded px-3 py-2 bg-background"
            >
              <option value="1w">1 week</option>
              <option value="2w">2 weeks</option>
              <option value="3w">3 weeks</option>
              <option value="4w">4 weeks</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium">Start date</label>
            <input
              v-model="form.startDate"
              type="datetime-local"
              class="w-full border rounded px-3 py-2 bg-background"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium">End date</label>
          <input
            v-model="form.endDate"
            type="datetime-local"
            class="w-full border rounded px-3 py-2 bg-background"
            :disabled="form.duration !== 'custom'"
          />
          <p v-if="form.duration !== 'custom'" class="text-xs text-muted-foreground">
            End date auto-generated from duration.
          </p>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium">Sprint goal</label>
          <textarea
            v-model="form.goal"
            class="w-full border rounded px-3 py-2 bg-background min-h-22.5"
            placeholder="Optional..."
          />
        </div>
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
          Create
        </button>
      </div>
    </div>
  </div>
</template>
