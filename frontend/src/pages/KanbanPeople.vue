<script setup lang="ts">
import { ProjectService } from "@/api/project.api";
import { UserService } from "@/api/user.api";
import InviteProjectMemberDialog from "@/components/InviteProjectMemberDialog.vue";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastStore } from "@/components/ui/toast/toast.store";
import { usePermission } from "@/composable/userPermission";
import { useAuthStore } from "@/stores/auth.store";
import type { ProjectMemberInterface, ProjectRoleEnum } from "@/types/project";
import { UserRoleEnum } from "@/types/role";
import type { UserInterface } from "@/types/user";
import { hasRole } from "@/utils/permission";
import { formatRelativeDate } from "@/utils/time";
import { SearchIcon } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
const route = useRoute();
const search = ref("");
const auth = useAuthStore();
const showInvite = ref(false);
const memberList = ref<ProjectMemberInterface[]>([]);
const memberIds = ref<number[]>([]);
const unselectedUsers = ref([]);
const permission = usePermission();

const onSearch = async () => {
  await loadMembers(search.value.trim());
};

const inviteMembers = async ({
  userIds,
  role,
}: {
  userIds: number[];
  role: ProjectRoleEnum;
}) => {
  const { status } = await ProjectService.addProjectMembers(route.params.key as string, {
    userIds,
    role,
  });
  if (status === 201) {
    toastStore.show("Invite members successfully!", "success");
    showInvite.value = false;
    await onPageLoad();
  }
};

const loadMembers = async (search?: string) => {
  const { data: response, status } = search
    ? await ProjectService.getProjectMembers(route.params.key as string, search)
    : await ProjectService.getProjectMembers(route.params.key as string);
  if (status === 200) {
    memberList.value = response.data;
    memberIds.value = memberList.value.map((m) => m.userId);
  }
};
const loadUsers = async () => {
  const { data: response, status } = await UserService.getUsers();

  if (status === 200) {
    unselectedUsers.value = response.data.filter(
      (u: UserInterface) => !memberIds.value.includes(u.id)
    );
  }
};

const openInviteModal = () => {
  showInvite.value = true;
};

const removeMember = async (id: number) => {
  const { status } = await ProjectService.removeMember(route.params.key as string, id);
  if (status === 200) {
    toastStore.show("Remove member successfully!", "success");
    await onPageLoad();
  }
};

const onPageLoad = async () => {
  await loadMembers();
  await loadUsers();
  permission.syncPermission(0, auth.role!);
};

onMounted(async () => {
  await onPageLoad();
});
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
          <router-link :to="`/kanban/board/${route.params.key}`">Board</router-link>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>People</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </div>
  <div class="flex justify-between">
    <InputGroup class="max-w-62.5">
      <InputGroupInput v-model="search" placeholder="Search" @keyup.enter="onSearch" />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
    <Button
      variant="outline"
      v-if="permission.isAllowed()"
      @click="openInviteModal"
    >
      Invite
    </Button>
    <InviteProjectMemberDialog
      :open="showInvite"
      :users="unselectedUsers"
      @close="showInvite = false"
      @invite="inviteMembers"
    />
  </div>
  <br />
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Joined</TableHead>
        <TableHead
          v-if="permission.isAllowed()"
          >Action</TableHead
        >
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="member in memberList" :key="member.userId">
        <TableCell>{{ member.name }}</TableCell>
        <TableCell>{{ member.email }}</TableCell>
        <TableCell class="uppercase">{{ member.role }}</TableCell>
        <TableCell>{{ formatRelativeDate(member.joinedAt) }}</TableCell>
        <TableCell
          v-if="permission.isAllowed()"
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              class="flex flex-col justify-center font-bold hover:bg-gray-200 px-2 pb-2 rounded-sm"
              title="More actions"
              >...</DropdownMenuTrigger
            >
            <DropdownMenuContent>
              <DropdownMenuItem @click="removeMember(member.userId)"
                >Remove</DropdownMenuItem
              >
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
