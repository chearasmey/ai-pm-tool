<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { useProjectStore } from "@/stores/project.store";
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
import { UserService } from "@/api/user.api";
import { type UserInterface } from "@/types/user";
import CreateUserDialog from "./CreateUserDialog.vue";
import type { UserRoleEnum } from "@/types/role";
import ResetPasswordDialog from "./ResetPasswordDialog.vue";
type SelectedUserType = {
  id: number;
  email: string;
  name: string | null;
  role: UserRoleEnum;
}
const auth = useAuthStore();

const search = ref("");
const page = ref(1);
const totalPages = ref(1);
const limit = APP_CONFIG.PAGINATION_LIMIT;
const showDialogRef = ref<HTMLElement>();
const seletedProjectKey = ref("");
const users = ref<UserInterface[]>([]);
const isShowCreate = ref(false);
const isShowEdit = ref(false);
const selectedUser = ref<SelectedUserType>();
const isShowReset = ref(false);

const loadSystemUsers = async () => {

  const { data: response, status} = await UserService.getSystemUsers(search.value, page.value, limit);
  console.log(response, status);
  if(status === 200) {
    users.value = response.data.items;
    totalPages.value = response.data.totalPages;
  }

};

const onPageChange = async (p: number) => {
  page.value = p;
  await loadSystemUsers();
};

const onSearch = async () => {
  page.value = 1;
  await loadSystemUsers();
};

const handleDeleteUser = (user: SelectedUserType) => {
  selectedUser.value = user;
  showDialogRef.value?.click();
};
const deleteUser = async () => {
  if (!selectedUser.value) return;
  const { status } = await UserService.deleteUser(selectedUser.value.id);
  if (status === 200) {
    toastStore.show("The user is deleted!", "success");
    await loadSystemUsers();
  }
};

const handleEditUser = async (user: SelectedUserType) => {
  selectedUser.value = user;
  isShowEdit.value = true;
}

const handleResetPassword = async (user: SelectedUserType) => {
  selectedUser.value = user;
  isShowReset.value = true;
}

onMounted(async () => {
  await loadSystemUsers();
});
</script>
<template>
  <div class="flex justify-between">
    <h1 class="text-2xl font-semibold mb-4 uppercase">Users</h1>
    <Button variant="outline" @click="isShowCreate = true"> Create </Button>
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
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Last update</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="user in users">
          <TableCell>
            {{ user.name }}
          </TableCell>
          <TableCell>{{ user.email }}</TableCell>
          <TableCell>{{ user.role.toLocaleUpperCase() }}</TableCell>
          <TableCell>{{ formatRelativeDate(user.createdAt ?? "-") }}</TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger
                class="flex flex-col justify-center font-bold hover:bg-gray-200 px-2 pb-2 rounded-sm"
                title="More actions"
                >...</DropdownMenuTrigger
              >
              <DropdownMenuContent>
                <DropdownMenuItem @click="handleEditUser(user)">Edit</DropdownMenuItem>
                <DropdownMenuItem @click="handleResetPassword(user)">Reset</DropdownMenuItem>
                <DropdownMenuItem @click="handleDeleteUser(user)"
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
            This action cannot be undone. This will permanently delete user.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="deleteUser">Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <CreateUserDialog
      :open="isShowCreate"
      mode="create"
      @close="isShowCreate = false"
      @saved="loadSystemUsers()"
    />

    <CreateUserDialog
      :open="isShowEdit"
      mode="update"
      :user="selectedUser"
      @close="isShowEdit = false"
      @saved="loadSystemUsers()"
    />

    <ResetPasswordDialog
      :open="isShowReset"
      :user="selectedUser"
      @close="isShowReset = false"
      @reset="loadSystemUsers()"
    />
  </div>
</template>
