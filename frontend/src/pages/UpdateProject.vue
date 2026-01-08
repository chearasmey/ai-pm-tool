<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRoute, useRouter } from "vue-router";
import { generateProjectKey } from "@/utils/projectKey";
import { toastStore } from "@/components/ui/toast/toast.store";
import { onMounted, ref, watch } from "vue";
import { ProjectService } from "@/api/project.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserService } from "@/api/user.api";
import type { ProjectTypeEnum } from "@/types/project";
import type { UserInterface } from "@/types/user";

const props = defineProps<{
  type: ProjectTypeEnum;
}>();

const router = useRouter();
const route = useRoute();
const form = ref({
  name: "",
  projectKey: "",
  description: "",
  leadUserId: 0,
  type: props.type,
});
const userList = ref<UserInterface[]>([]);

const projectKeyError = ref("");
const projectNameError = ref("");

const update = async () => {
  const { status } = await ProjectService.updateProject(
    route.params.key as string,
    form.value
  );
  if (status === 200) {
    toastStore.show("Update project successfully.", "success");
    router.push(`/${props.type}`);
  }
};

const getProjectDetail = async (projectKey: string) => {
  const { data: response, status } = await ProjectService.getProjectByKey(projectKey);
  if (status === 200) {
    const { data } = response;
    form.value.name = data.name;
    form.value.projectKey = data.projectKey;
    form.value.description = data.description;
    form.value.leadUserId = data.leadUserId;
  }
};

const getUserList = async () => {
  const { data: response, status } = await UserService.getUsers();
  if (status === 200) {
    userList.value = response.data;
  }
};

watch(
  () => [form.value.name, form.value.leadUserId],
  ([newName, newLeadUserId]) => {
    form.value.projectKey = generateProjectKey(newName as string);
    form.value.leadUserId = Number(newLeadUserId);
  }
);

onMounted(async () => {
  await getProjectDetail(route.params.key as string);
  await getUserList();
});
</script>
<template>
  <div class="mb-3">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <router-link :to="`/${type}`">{{ type.toUpperCase() }}</router-link>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Project Detail</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </div>
  <div class="m-auto max-w-xl space-y-6 bg-white p-3 rounded-sm">
    <h1 class="text-xl font-semibold text-center">
      {{ type.toLocaleUpperCase() }} Project
    </h1>
    <Input v-model="form.name" placeholder="Project name" />
    <Input v-model="form.projectKey" placeholder="PROJECT KEY" />
    <Textarea v-model="form.description" placeholder="Description" />
    <Select v-model="form.leadUserId">
      <SelectTrigger class="min-w-45">
        <SelectValue placeholder="Project Lead" />
      </SelectTrigger>
      <SelectContent>
        <div v-for="user in userList" :key="user.id">
          <SelectItem :value="user.id">{{ user.name }}</SelectItem>
        </div>
      </SelectContent>
    </Select>
    <p
      v-if="projectNameError"
      class="text-sm text-red-500 italic"
      v-html="'<strong>Project name:</strong> ' + projectNameError"
    ></p>
    <p
      v-if="projectKeyError"
      class="text-sm text-red-500 italic"
      v-html="'<strong>PROJECT KEY:</strong> ' + projectKeyError"
    ></p>

    <div class="flex justify-center">
      <Button variant="outline" @click="update">Update</Button>
    </div>
  </div>
</template>
