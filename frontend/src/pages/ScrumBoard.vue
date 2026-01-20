<script setup lang="ts">
import { BoardStatusService } from "@/api/board-status.api";
import { IssueService } from "@/api/issue.api";
import { SprintService } from "@/api/sprint.api";
import BacklogAccordion from "@/components/BacklogAccordion.vue";
import CreateIssueDialog from "@/components/CreateIssueDialog.vue";
import CreateSprintDialog from "@/components/CreateSprintDialog.vue";
import IssueViewDialog from "@/components/IssueViewDialog.vue";
import KanbanColumn from "@/components/KanbanColumn.vue";
import SprintAccordionItem from "@/components/SprintAccordionItem.vue";
import StopSprintDialog from "@/components/StopSprintDialog.vue";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toastStore } from "@/components/ui/toast/toast.store";
import { usePermission } from "@/composable/userPermission";
import { useAuthStore } from "@/stores/auth.store";
import type { ProjectInterface } from "@/types/project";
import { UserRoleEnum } from "@/types/role";
import { UserIcon } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";
type Sprint = {
  id: number;
  name: string;
  status: SprintStatus;
  startDate?: string | null;
  endDate?: string | null;
  goal?: string | null;
};
type Issue = {
  id: number;
  title: string;
  type: string;
  priority: string;
  statusId: number;
  assigneeName?: string | null;
  sprintId: number | null;
};
type Status = {
  id: number;
  name: string;
  category: "TODO" | "IN_PROGRESS" | "DONE";
  position: number;
};

const permission = usePermission();

const loading = ref(false);
const error = ref<string | null>(null);

const statuses = ref<Status[]>([]);
const sprints = ref<Sprint[]>([]);
const backlogIssues = ref<Issue[]>([]);
const sprintIssuesMap = ref<Record<number, Issue[]>>({});

// Accordion open: last sprint expanded
const openSprintId = ref<number | null>(null);

const showCreateSprint = ref(false);

const auth = useAuthStore();
const route = useRoute();
const project = ref<ProjectInterface>();
const showCreateIssue = ref(false);
const showIssueView = ref(false);
const projectKey = ref(route.params.key as string);
const issueIdView = ref<number>(0);
const isActiveSprint = ref(false);
const activeIssues = ref<Issue[]>([]);
const acitveSprint = ref<Sprint>();
const isShowStopSprint = ref(false);

const loadScrumBoards = async (projectkey: string) => {
  const { data: response, status } = await BoardStatusService.getBoards(projectkey);
  if (status === 200) {
    project.value = response.data.project;
    statuses.value = response.data.statuses;
    sprints.value = response.data.sprints;
    backlogIssues.value = response.data.backlogIssues;
    sprintIssuesMap.value = response.data.sprintIssuesMap;
    openSprintId.value = sprints.value[sprints.value.length - 1]?.id??null;
    await loadActiveSprints(project.value?.id as number);
    permission.syncPermission(project.value?.id as number, auth.role!);
  }
};

const loadActiveSprints = async (projectId: number) => {
  if (!project.value) return;
  const { data: response, status } = await SprintService.getAcitve(projectId);
  if (status === 200 && response.data) {
    activeIssues.value = response.data.issues;
    acitveSprint.value = response.data.sprint;
    if (acitveSprint.value?.id) {
      isActiveSprint.value = true;
    }
  }
};

const handleCreateSprint = async (payload: {
  name: string;
  startDate: string;
  endDate: string;
  goal: string | null;
}) => {
  loading.value = true;
  error.value = null;

  try {
    if (!project.value?.id) return;
    const { data, status } = await SprintService.create(project.value?.id, payload);
    if (status === 201) {
      sprints.value.push(data.data);
      sprintIssuesMap.value[data.data.id] = [];
      showCreateSprint.value = false;
      openSprintId.value = data.data.id;
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || "An error occurred";
  } finally {
    loading.value = false;
  }
};

const handleCreatedIssue = async (message: string) => {
  if (!project.value) return;
  toastStore.show(message, "success");
  await loadScrumBoards(project.value.projectKey);
  showCreateIssue.value = false;
};

const onUpdatedIssue = async () => {
  if (!project.value) return;
  await loadScrumBoards(project.value.projectKey);
  showIssueView.value = false;
};

const onDeltedIssue = async () => {
  if (!project.value) return;
  await loadScrumBoards(project.value.projectKey);
};

const handleDropToSprint = async (payload: { issueId: number; sprintId: number }) => {
  if (!payload.sprintId) return;
  const { status } = await IssueService.moveToSprint(payload.issueId, payload.sprintId);
  if (status === 200) {
    await loadScrumBoards(route.params.key as string);
  }
};

const handleDropBacklog = async (issueId: number) => {
  if (!issueId) return;
  const { status } = await IssueService.moveToBacklog(issueId);
  if (status === 200) {
    await loadScrumBoards(route.params.key as string);
  }
};

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
  const filterActiveStatuses = activeIssues.value.filter((a) => a.statusId === id);
  return filterActiveStatuses ?? [];
};

async function onDropIssue(payload: {
  issueId: number;
  currentStatusId: number;
  toStatusId: number;
}) {
  try {
    const { status } = await IssueService.moveIssue(payload.issueId, payload.toStatusId);
    if (status === 200) {
      await loadScrumBoards(route.params.key as string);
    }
  } catch (e) {
    // rollback
    console.error(e);
  }
}

const handleViewIssue = async (issueId: number) => {
  issueIdView.value = issueId;
  showIssueView.value = true;
};

const handleRemoveIssue = async () => {
  await loadScrumBoards(route.params.key as string);
};

const onStartSprint = async (sprintId: number) => {
  await SprintService.start(sprintId);
  await loadScrumBoards(route.params.key as string);
};

const handleStoppedSprint = async () => {
  if (!acitveSprint.value) return;
  await loadScrumBoards(route.params.key as string);
  isShowStopSprint.value = false;
};

const onDeletedSprint = async () => {
  await loadScrumBoards(route.params.key as string);
  toastStore.show("Delete Sprint Successfully", "success");
}

const onUpdatedSprint = async () => {
  await loadScrumBoards(route.params.key as string);
  toastStore.show("Update Sprint Successfully", "success");
}

onMounted(async () => {
  await loadScrumBoards(route.params.key as string);
});
</script>
<template>
  <div class="mb-3">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <router-link :to="`/scrum`">SCRUM</router-link>
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
        <router-link :to="`/scrum/board/${route.params.key}/people`"
          ><UserIcon
        /></router-link>
      </div>

      <DropdownMenu
        v-if="permission.isAllowed()"
      >
        <DropdownMenuTrigger
          class="flex flex-col justify-center font-bold hover:bg-gray-200 px-2 pb-2 rounded-sm"
          title="More actions"
          >...</DropdownMenuTrigger
        >
        <DropdownMenuContent>
          <DropdownMenuItem>
            <router-link :to="`/scrum/project/${route.params.key}`"
              >Project Setting</router-link
            >
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <Button variant="outline" as-child>
      <router-link to="#" @click="showCreateIssue = true">Create</router-link>
    </Button>
  </div>
  <div>
    <Tabs default-value="backlog">
      <TabsList>
        <TabsTrigger value="backlog">Backlog</TabsTrigger>
        <TabsTrigger value="active">Active Sprint</TabsTrigger>
      </TabsList>
      <TabsContent value="backlog">
        <div>
          <!-- Sprint accordion list -->
          <div class="space-y-2">
            <SprintAccordionItem
              v-for="sprint in sprints"
              :key="sprint.id"
              :sprint="sprint"
              :issues="sprintIssuesMap[sprint.id] || []"
              :statuses="statuses"
              :open="openSprintId === sprint.id"
              @toggle="openSprintId = openSprintId === sprint.id ? null : sprint.id"
              @start-sprint="onStartSprint(sprint.id)"
              @drop-to-sprint="handleDropToSprint"
              :is-permission="permission.isAllowed()"
              @deleted="onDeletedSprint"
              @updated="onUpdatedSprint"
            />
          </div>

          <div class="my-3">
            <BacklogAccordion
              :project-key="projectKey"
              :issues="backlogIssues"
              :is-permission="permission.isAllowed()"
              @create-sprint="showCreateSprint = true"
              @drop-to-backlog="handleDropBacklog"
              @deleted="onDeltedIssue"
              @updated="onUpdatedIssue"
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="active">
        <div
          v-if="!isActiveSprint"
          class="h-[50vh] flex justify-center items-center border-2 border-dashed rounded-sm uppercase"
        >
          No Active Sprint
        </div>
        <div v-else>
          <div class="flex justify-end mb-3">
            <Button
              v-if="permission.isAllowed()"
              variant="outline"
              class="uppercase"
              @click="isShowStopSprint = true"
              >Stop</Button
            >
          </div>
          <div class="flex gap-4 overflow-x-auto pb-2">
            <KanbanColumn
              v-for="st in orderedStatuses"
              :key="st.id"
              :status="st"
              :issues="issuesByStatusId(st.id) || []"
              @drop-issue="onDropIssue"
              @view="handleViewIssue"
              @is-removed-issue="handleRemoveIssue"
              :is-permission="false"
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>

  <CreateIssueDialog
    :project-key="projectKey"
    :open="showCreateIssue"
    @close="showCreateIssue = false"
    @created="handleCreatedIssue"
  />

  <CreateSprintDialog
    :open="showCreateSprint"
    @close="showCreateSprint = false"
    @submit="handleCreateSprint"
  />

  <IssueViewDialog
    :open="showIssueView"
    :project-key="projectKey"
    :issue-id="issueIdView"
    @close="showIssueView = false"
    @updated="onUpdatedIssue"
  />

  <StopSprintDialog
    v-if="acitveSprint"
    :open="isShowStopSprint"
    :active-sprint="acitveSprint"
    @close="isShowStopSprint = false"
    @stopped="handleStoppedSprint"
  />
</template>
