<script setup lang="ts">
import { IssueService } from "@/api/issue.api";
import { computed, onMounted, ref, watch } from "vue";

type IssueType = "EPIC" | "STORY" | "TASK" | "BUG" | "SUBTASK";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE";

type Status = { id: number; name: string; category: StatusCategory; position: number };
type Member = { userId: number; name: string; projectRole: "MEMBER" | "ADMIN" };

const props = defineProps<{ open: boolean; projectKey: string; issueId: number }>();
const emit = defineEmits<{ (e: "close"): void; (e: "updated", message: string): void }>();

const loadingMeta = ref(false);
const submitting = ref(false);
const errorMsg = ref<string | null>(null);

const statuses = ref<Status[]>([]);
const members = ref<Member[]>([]);
const defaultStatusId = ref<number | null>(null);

const form = ref({
  title: "",
  type: "TASK" as IssueType,
  description: "",
  startDate: "",
  dueDate: "",
  priority: "MEDIUM" as Priority,
  statusId: null as number | null,
  assigneeId: null as number | null,

  originalEstimate: null as number | null, // minutes
  remainingEstimate: null as number | null, // minutes
  timeSpent: null as number | null, // minutes
});

function toISO(v: string) {
  if (!v) return undefined;
  return new Date(v).toISOString();
}

function setQuickMinutes(
  field: "originalEstimate" | "remainingEstimate" | "timeSpent",
  minutes: number
) {
  form.value[field] = minutes;
}

async function getIssueById(issueId: number) {
  if(!issueId) return ;
  const { data, status } = await IssueService.getIssueById(issueId);
  if (status === 200) {
    const issue = data.data;
    form.value.title = issue.title;
    form.value.type = issue.type;
    form.value.description = issue.description || "";
    form.value.startDate = issue.startDate
      ? new Date(issue.startDate).toISOString().slice(0, 16)
      : "";
    form.value.dueDate = issue.dueDate
      ? new Date(issue.dueDate).toISOString().slice(0, 16)
      : "";
    form.value.priority = issue.priority;
    form.value.statusId = issue.statusId;
    form.value.assigneeId = issue.assigneeId;
    form.value.originalEstimate = issue.originalEstimate || null;
    form.value.remainingEstimate = issue.remainingEstimate || null;
    form.value.timeSpent = issue.timeSpent || null;
  }
}

async function loadMetadata() {
  loadingMeta.value = true;
  try {
    const { data: response, status } = await IssueService.getIssueMetaData(
      props.projectKey
    );
    if (status === 200) {
      statuses.value = response.data.statuses;
      members.value = response.data.members;
      defaultStatusId.value = response.data.defaultStatusId;
      form.value.statusId = defaultStatusId.value;
    }
  } finally {
    loadingMeta.value = false;
  }
}

// DONE columns must be at end
const orderedStatuses = computed(() => {
  const s = [...statuses.value];
  s.sort((a, b) => {
    // non-DONE first, DONE last
    const aDone = a.category === "DONE" ? 1 : 0;
    const bDone = b.category === "DONE" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;

    // within same category group, by position then id
    if (a.position !== b.position) return a.position - b.position;
    return a.id - b.id;
  });
  return s;
});

watch(
  () => props.open,
  async (v) => {
    if (!v) return;

    errorMsg.value = null;
    form.value = {
      title: "",
      type: "TASK",
      description: "",
      startDate: "",
      dueDate: "",
      priority: "MEDIUM",
      statusId: null,
      assigneeId: null,
      originalEstimate: null,
      remainingEstimate: null,
      timeSpent: null,
    };

    await loadMetadata();
    await getIssueById(props.issueId);
  }
);

const canSubmit = computed(
  () => form.value.title.trim().length >= 2 && !submitting.value
);

async function submit() {
  if (!canSubmit.value) return;
  errorMsg.value = null;
  submitting.value = true;

  try {
    const payload = {
      title: form.value.title.trim(),
      type: form.value.type,
      description: form.value.description.trim() || undefined,

      startDate: toISO(form.value.startDate),
      dueDate: toISO(form.value.dueDate),

      priority: form.value.priority,
      statusId: form.value.statusId,
      assigneeId: form.value.assigneeId,

      originalEstimate: form.value.originalEstimate ?? undefined,
      remainingEstimate: form.value.remainingEstimate ?? undefined,
      timeSpent: form.value.timeSpent ?? undefined,
    };

    const { data: response, status } = await IssueService.updateIssue(
      props.issueId,
      payload
    );
    if (status === 200) {
      emit("updated", response.message!);
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await loadMetadata();
  await getIssueById(props.issueId);
});
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')" />

    <div
      class="absolute left-1/2 top-1/2 w-160 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background border shadow p-5"
    >
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">View Issue</h2>
        <button
          class="text-sm text-muted-foreground hover:text-foreground"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div v-if="loadingMeta" class="text-sm text-muted-foreground">Loading...</div>

      <div v-else class="space-y-3">
        <div class="grid grid-cols-3 gap-3">
          <div class="space-y-1">
            <label class="text-sm font-medium" for="type">Type</label>
            <select
              v-model="form.type"
              class="w-full border rounded px-3 py-2 bg-background"
              name="type"
            >
              <option value="EPIC">Epic</option>
              <option value="STORY">Story</option>
              <option value="TASK">Task</option>
              <option value="BUG">Bug</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium" for="priority">Priority</label>
            <select
              v-model="form.priority"
              class="w-full border rounded px-3 py-2 bg-background"
              name="priority"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium" for="status">Status</label>
            <select
              v-model="form.statusId"
              class="w-full border rounded px-3 py-2 bg-background"
              name="status"
            >
              <option v-for="s in orderedStatuses" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium" for="title">Title</label>
          <input
            v-model="form.title"
            class="w-full border rounded px-3 py-2 bg-background"
            placeholder="e.g. Setup login page"
            name="title"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium" for="description">Description</label>
          <textarea
            v-model="form.description"
            class="w-full border rounded px-3 py-2 bg-background min-h-22.5"
            placeholder="Optional..."
            name="description"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-sm font-medium" for="startDate">Start date</label>
            <input
              v-model="form.startDate"
              type="datetime-local"
              class="w-full border rounded px-3 py-2 bg-background"
              name="startDate"
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium" for="dueDate">Due date</label>
            <input
              v-model="form.dueDate"
              type="datetime-local"
              class="w-full border rounded px-3 py-2 bg-background"
              name="dueDate"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="space-y-1">
            <label class="text-sm font-medium" for="originalEstimate"
              >Original estimate (min)</label
            >
            <input
              v-model.number="form.originalEstimate"
              type="number"
              min="0"
              class="w-full border rounded px-3 py-2 bg-background"
              placeholder="e.g. 120"
              name="originalEstimate"
            />
            <div class="flex gap-2 flex-wrap mt-2">
              <button
                class="text-xs px-2 py-1 border rounded hover:bg-muted"
                @click="setQuickMinutes('originalEstimate', 30)"
              >
                30m
              </button>
              <button
                class="text-xs px-2 py-1 border rounded hover:bg-muted"
                @click="setQuickMinutes('originalEstimate', 60)"
              >
                1h
              </button>
              <button
                class="text-xs px-2 py-1 border rounded hover:bg-muted"
                @click="setQuickMinutes('originalEstimate', 480)"
              >
                1d
              </button>
              <button
                class="text-xs px-2 py-1 border rounded hover:bg-muted"
                @click="setQuickMinutes('originalEstimate', 2400)"
              >
                1w
              </button>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium" for="remainingEstimate"
              >Remaining (min)</label
            >
            <input
              v-model.number="form.remainingEstimate"
              type="number"
              min="0"
              class="w-full border rounded px-3 py-2 bg-background"
              placeholder="e.g. 90"
              name="remainingEstimate"
            />
            <div class="flex gap-2 flex-wrap mt-2">
              <button
                class="text-xs px-2 py-1 border rounded hover:bg-muted"
                @click="setQuickMinutes('remainingEstimate', 30)"
              >
                30m
              </button>
              <button
                class="text-xs px-2 py-1 border rounded hover:bg-muted"
                @click="setQuickMinutes('remainingEstimate', 60)"
              >
                1h
              </button>
              <button
                class="text-xs px-2 py-1 border rounded hover:bg-muted"
                @click="setQuickMinutes('remainingEstimate', 480)"
              >
                1d
              </button>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium" for="timeSpent">Time spent (min)</label>
            <input
              v-model.number="form.timeSpent"
              type="number"
              min="0"
              class="w-full border rounded px-3 py-2 bg-background"
              placeholder="e.g. 30"
              name="timeSpent"
            />
            <div class="flex gap-2 flex-wrap mt-2">
              <button
                class="text-xs px-2 py-1 border rounded hover:bg-muted"
                @click="setQuickMinutes('timeSpent', 15)"
              >
                15m
              </button>
              <button
                class="text-xs px-2 py-1 border rounded hover:bg-muted"
                @click="setQuickMinutes('timeSpent', 30)"
              >
                30m
              </button>
              <button
                class="text-xs px-2 py-1 border rounded hover:bg-muted"
                @click="setQuickMinutes('timeSpent', 60)"
              >
                1h
              </button>
            </div>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium" for="assignee">Assignee</label>
          <select
            v-model="form.assigneeId"
            class="w-full border rounded px-3 py-2 bg-background"
            name="assignee"
          >
            <option :value="null">Unassigned</option>
            <option v-for="m in members" :key="m.userId" :value="m.userId">
              {{ m.name }}
            </option>
          </select>
        </div>

        <div
          v-if="errorMsg"
          class="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-lg p-3"
        >
          {{ errorMsg }}
        </div>

        <div class="flex justify-between">
          <div></div>

          <div class="flex justify-end gap-2 mt-4">
            <button
              class="px-3 py-2 rounded border hover:bg-muted"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              class="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
              :disabled="!canSubmit"
              @click="submit"
            >
              {{ submitting ? "Creating..." : "Save" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
