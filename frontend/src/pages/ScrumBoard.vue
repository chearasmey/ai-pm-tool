<script setup lang="ts">
import { BoardStatusService } from "@/api/board-status.api";
import { ProjectService } from "@/api/project.api";
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
import type { ProjectInterface } from "@/types/project";
import { UserRoleEnum } from "@/types/role";
import { hasRole } from "@/utils/permission";
import { UserIcon } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
const auth = useAuthStore();
const route = useRoute();
const project = ref<ProjectInterface>();

const getScrumBoards = async (projectkey: string) => {
  const { data: response, status } = await BoardStatusService.getBoards(projectkey);
  if (status === 200) {
    project.value = response.data.project;
  }
};

onMounted(async () => {
  await getScrumBoards(route.params.key as string);
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
      <router-link to="#">Create</router-link>
    </Button>
  </div>
  <div
    v-if="hasRole(auth.user?.role!, [UserRoleEnum.SYSTEM_ADMIN, UserRoleEnum.PROJECT_ADMIN])"
  >
    Sprint Accordion <br />
    Backlog Accordion
  </div>
  <div>Active sprint</div>
</template>
