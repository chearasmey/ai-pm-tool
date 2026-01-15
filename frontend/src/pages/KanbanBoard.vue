<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth.store";
import { UserRoleEnum } from "@/types/role";
import { hasRole } from "@/utils/permission";
import { UserIcon } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import KanbanColumn from "@/components/KanbanColumn.vue";
import type { ProjectInterface } from "@/types/project";
import AddStatusDialog from "@/components/AddStatusDialog.vue";
import { BoardStatusService } from "@/api/board-status.api";
import RenameStatusDialog from "@/components/RenameStatusDialog.vue";
import RemoveStatusDialog from "@/components/RemoveStatusDialog.vue";
import CreateIssueDialog from "@/components/CreateIssueDialog.vue";
import { IssueService } from "@/api/issue.api";
import IssueViewDialog from "@/components/IssueViewDialog.vue";
import { toastStore } from "@/components/ui/toast/toast.store";
const auth = useAuthStore();
const route = useRoute();

type StatusCategory = "TODO" | "IN_PROGRESS" | "DONE";
type BoardStatus = {
  id: number;
  name: string;
  category: StatusCategory;
  position: number;
  issues?: Issue[];
};
type Issue = {
  id: number;
  title: string;
  type: string;
  assigneeName?: string | null;
  statusId: number;
};

const project = ref<ProjectInterface>();

// state
const statuses = ref<BoardStatus[]>([]);
const loading = ref(false);

// dialogs
const showAdd = ref(false);
const showRename = ref(false);
const renameTarget = ref<BoardStatus | null>(null);
const showRemove = ref(false);
const removeTarget = ref<BoardStatus | null>(null);
const projectKey = computed(() => route.params.key as string);
const showCreate = ref(false);
const showIssueView = ref(false);
const issueIdView = ref<number>(0);

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

const issuesByStatusId = (id: number): Issue[] => {
  const find = statuses.value.find((st) => st.id === id);
  if (!find) return [];
  return find?.issues || [];
};

const loadKanbanBoard = async (projectkey: string) => {
  loading.value = true;
  try {
    const { data: response, status } = await BoardStatusService.getBoards(projectkey);
    if (status === 200) {
      statuses.value = response.data.columns;
      project.value = response.data.project;
    }
  } catch (error) {
    console.error("Failed to fetch kanban boards:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadKanbanBoard(projectKey.value);
});

async function onDropIssue(payload: {
  issueId: number;
  currentStatusId: number;
  toStatusId: number;
}) {
  try {
    const { status } = await IssueService.moveIssue(payload.issueId, payload.toStatusId);
    if (status === 200) {
      await loadKanbanBoard(projectKey.value);
    }
  } catch (e) {
    // rollback
    console.error(e);
  }
}

function openRename(status: BoardStatus) {
  renameTarget.value = status;
  showRename.value = true;
}

const handleCreateStatus = async (payload: {
  name: string;
  category: StatusCategory;
}) => {
  const { status } = await BoardStatusService.createBoardStatus(
    projectKey.value,
    payload
  );
  if (status === 201) {
    await loadKanbanBoard(projectKey.value);
  }
};

const handleRenameStatus = async (payload: { statusId: number; name: string }) => {
  if (!renameTarget.value) return;
  const { status } = await BoardStatusService.updateBoardStatus(
    projectKey.value,
    payload
  );
  if (status === 200) {
    showRename.value = false;
    await loadKanbanBoard(projectKey.value);
  }
};

const handleRemoveStatus = async (statusId: number) => {
  showRemove.value = true;
  removeTarget.value = statuses.value.find((s) => s.id === statusId) || null;
};

const onStatusRemoved = async () => {
  await loadKanbanBoard(projectKey.value);
};

const handleCreateIssue = async () => {
  showCreate.value = true;
};

const onCreateIssue = async (message: string) => {
  showCreate.value = false;
  toastStore.show(message, "success");
  await loadKanbanBoard(projectKey.value);
};

const handleViewIssue = async (issueId: number) => {
  issueIdView.value = issueId;
  showIssueView.value = true;
};

const onUpdatedIssue = async (message: string) => {
  showIssueView.value = false;
  toastStore.show(message, "success");
  await loadKanbanBoard(projectKey.value);
};

const handleRemoveIssue = async () => {
  await loadKanbanBoard(projectKey.value);
};

</script>
<template>
  <div class="mb-3">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <router-link :to="`/kanban`">KANBAN</router-link>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Board</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </div>
  <div class="flex justify-between">
    <div class="flex items-center gap-2 mb-4">
      <h1 class="text-2xl font-semibold uppercase">{{ project?.name }}</h1>

      <div class="hover:bg-gray-200 p-1 rounded-sm">
        <router-link :to="`/kanban/board/${route.params.key}/people`"
          ><UserIcon
        /></router-link>
      </div>

      <DropdownMenu
        v-if="hasRole(auth.user?.role!, [UserRoleEnum.SYSTEM_ADMIN, UserRoleEnum.PROJECT_ADMIN])"
      >
        <DropdownMenuTrigger
          class="flex flex-col justify-center font-bold hover:bg-gray-200 px-2 pb-2 rounded-sm"
          title="More actions"
          >...</DropdownMenuTrigger
        >
        <DropdownMenuContent>
          <DropdownMenuItem>
            <router-link :to="`/kanban/project/${route.params.key}`"
              >Project Setting</router-link
            >
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <Button variant="outline" as-child>
      <router-link to="#" @click="handleCreateIssue">Create</router-link>
    </Button>
  </div>

  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div></div>

      <Button
        variant="outline"
        v-if="hasRole(auth.user?.role!, [UserRoleEnum.SYSTEM_ADMIN, UserRoleEnum.PROJECT_ADMIN])"
        class="px-3 py-2 rounded border hover:bg-muted"
        @click="showAdd = true"
      >
        + Add column
      </Button>
    </div>

    <div v-if="loading" class="text-sm text-muted-foreground">Loading...</div>

    <div class="flex gap-4 overflow-x-auto pb-2">
      <KanbanColumn
        v-for="st in orderedStatuses"
        :key="st.id"
        :status="st"
        :issues="issuesByStatusId(st.id) || []"
        @drop-issue="onDropIssue"
        @rename="openRename"
        @delete="handleRemoveStatus"
        @view="handleViewIssue"
        @is-removed-issue="handleRemoveIssue"
      />

      <AddStatusDialog
        :open="showAdd"
        @close="showAdd = false"
        @submit="handleCreateStatus"
      />

      <RenameStatusDialog
        :open="showRename"
        :status="renameTarget"
        @close="showRename = false"
        @submit="handleRenameStatus"
      />

      <RemoveStatusDialog
        :open="showRemove"
        :projectKey="projectKey"
        :status="removeTarget"
        :statuses="statuses"
        @close="showRemove = false"
        @removed="onStatusRemoved"
      />

      <CreateIssueDialog
        :open="showCreate"
        :project-key="projectKey"
        @close="showCreate = false"
        @created="onCreateIssue"
      />

      <IssueViewDialog
        :open="showIssueView"
        :project-key="projectKey"
        :issue-id="issueIdView"
        @close="showIssueView = false"
        @updated="onUpdatedIssue"
      />
    </div>
  </div>
</template>
