<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { useProjectStore } from "@/stores/project.store";
import { UserRole } from "@/types/role";
import { hasRole } from "@/utils/permission";
import { ProjectTypeEnum } from "@/types/projectTypeEnum";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-vue-next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProjectType } from "@/types/project";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomPagination from "@/components/CustomPagination.vue";
import { APP_CONFIG } from "@/config/app.config";
import { formatRelativeDate } from "@/utils/time";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { ProjectService } from "@/api/project.api";
import { toastStore } from "@/components/ui/toast/toast.store";

const auth = useAuthStore();
const projectStore = useProjectStore();
const projects = ref<ProjectType[]>([]);
const pagination = ref();
const search = ref();
const page = ref(1);
const totalPages = ref(1);
const limit = APP_CONFIG.PAGINATION_LIMIT;
const showDialogRef = ref<HTMLElement>();
const seletedProjectKey = ref("");
const fetchProjects = async () => {
  await projectStore.fetchProjects(
    ProjectTypeEnum.SCRUM,
    page.value,
    limit,
    search.value
  );
  projects.value = projectStore.projects;
  pagination.value = projectStore.pagination;
  totalPages.value = pagination.value.totalPages;
};

const onPageChange = async (p: number) => {
  page.value = p;
  await fetchProjects();
};

const onSearch = async () => {
  page.value = 1;
  await fetchProjects();
};

const showDeleteDialog = (projectKey: string) => {
  seletedProjectKey.value = projectKey;
  showDialogRef.value?.click();
};
const deleteProject = async () => {
  if (!seletedProjectKey.value) return;
  const { status } = await ProjectService.deleteProject(seletedProjectKey.value);
  if (status === 200) {
    toastStore.show("The project is deleted!", "success");
    await fetchProjects();
  }
};
onMounted(async () => {
  await fetchProjects();
});
</script>
<template>
  <div class="flex justify-between">
    <h1 class="text-2xl font-semibold mb-4 uppercase">Scrum</h1>
    <Button
      v-if="hasRole(auth.user?.role!, [UserRole.SYSTEM_ADMIN, UserRole.PROJECT_ADMIN])"
      as-child
    >
      <router-link to="/scrum/create">Create</router-link>
    </Button>
  </div>
  <div class="mt-3">
    <InputGroup class="max-w-62.5">
      <InputGroupInput v-model="search" placeholder="Search" @keyup.enter="onSearch" />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
    <br />
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Lead</TableHead>
          <TableHead>Last work update</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="project in projects">
          <TableCell>{{ project.name }}</TableCell>
          <TableCell>{{ project.projectKey }}</TableCell>
          <TableCell>{{ project.leadUserName ?? "-" }}</TableCell>
          <TableCell>{{ formatRelativeDate(project.updatedAt ?? "-") }}</TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger
                class="flex flex-col justify-center font-bold hover:bg-gray-200 px-2 pb-2 rounded-sm"
                title="More actions"
                >...</DropdownMenuTrigger
              >
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <router-link :to="`/scrum/project/${project.projectKey}`"
                    >Project Setting</router-link
                  >
                </DropdownMenuItem>
                <DropdownMenuItem v-if="hasRole(auth.user?.role!, [UserRole.SYSTEM_ADMIN, UserRole.PROJECT_ADMIN])" @click="showDeleteDialog(project.projectKey!)"
                  >Delete Now</DropdownMenuItem
                >
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <CustomPagination :page="page" :total-pages="totalPages" @change="onPageChange" />

    <AlertDialog>
      <AlertDialogTrigger>
        <button ref="showDialogRef" class="hidden">Show Dialog</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="deleteProject">Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
