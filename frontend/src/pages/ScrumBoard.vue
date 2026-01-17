<script setup lang="ts">
import { BoardStatusService } from "@/api/board-status.api";
import { SprintService } from "@/api/sprint.api";
import BacklogAccordion from "@/components/BacklogAccordion.vue";
import CreateIssueDialog from "@/components/CreateIssueDialog.vue";
import CreateSprintDialog from "@/components/CreateSprintDialog.vue";
import IssueViewDialog from "@/components/IssueViewDialog.vue";
import SprintAccordionItem from "@/components/SprintAccordionItem.vue";
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
import { toastStore } from "@/components/ui/toast/toast.store";
import { useAuthStore } from "@/stores/auth.store";
import type { ProjectInterface } from "@/types/project";
import { UserRoleEnum } from "@/types/role";
import { hasRole } from "@/utils/permission";
import { UserIcon } from "lucide-vue-next";
import { on } from "node:cluster";
import { onMounted, ref } from "vue";
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

const loadScrumBoards = async (projectkey: string) => {
  const { data: response, status } = await BoardStatusService.getBoards(projectkey);
  if (status === 200) {
    project.value = response.data.project;
    statuses.value = response.data.statuses;
    sprints.value = response.data.sprints;
    backlogIssues.value = response.data.backlogIssues;
    sprintIssuesMap.value = response.data.sprintIssuesMap;
    console.log(response.data);
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
};

const onDeltedIssue = async () => {
  if (!project.value) return;
  await loadScrumBoards(project.value.projectKey);
};

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
        v-if="hasRole(auth.user?.role!, [UserRoleEnum.SYSTEM_ADMIN, UserRoleEnum.PROJECT_ADMIN])"
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
  <div
    v-if="hasRole(auth.user?.role!, [UserRoleEnum.SYSTEM_ADMIN, UserRoleEnum.PROJECT_ADMIN])"
  >
    <!-- Sprint accordion list -->
    <div class="space-y-2">
      <SprintAccordionItem
        v-for="sprint in sprints"
        :key="sprint.id"
        :sprint="sprint"
        :issues="sprintIssuesMap[sprint.id] || []"
        :statuses="statuses"
        :open="openSprintId === sprint.id"
        :projectKey="project?.projectKey || ''"
        @toggle="openSprintId = openSprintId === sprint.id ? null : sprint.id"
        @start-sprint=""
      />
    </div>

    <div class="my-3">
      <BacklogAccordion
        :project-key="projectKey"
        :issues="backlogIssues"
        @create-sprint="showCreateSprint = true"
        @drop-to-backlog=""
        @deleted="onDeltedIssue"
        @updated="onUpdatedIssue"
      />
    </div>
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
</template>
