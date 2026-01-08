<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProjectService } from "@/api/project.api";
import type { ProjectTypeEnum } from "@/types/projectTypeEnum";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { generateProjectKey } from "@/utils/projectKey";
import { toastStore } from "@/components/ui/toast/toast.store";

const props = defineProps<{
  type: ProjectTypeEnum;
}>();

const router = useRouter();

const form = ref({
  name: "",
  projectKey: "",
  description: "",
});

const projectKeyError = ref("");
const projectNameError = ref("");

async function submit() {
  try {
    await ProjectService.createProject({
      ...form.value,
      type: props.type,
    });

    toastStore.show("Project created successfully", "success");
    router.push(`/${props.type}`);
  } catch (err: any) {
    console.log(err);
    const { errors } = err;
    if(errors && errors.projectKey){
      projectKeyError.value = (errors.projectKey as []).join("<br/>");
    }
    if(errors && errors.name){
      projectNameError.value = (errors.name as []).join("<br/>");
    }
  }
}

watch(
  () => form.value.name,
  (newName) => {
    form.value.projectKey = generateProjectKey(newName);
  }
);
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
          <BreadcrumbPage>Create</BreadcrumbPage>
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
    <p v-if="projectNameError" class="text-sm text-red-500 italic" v-html="'<strong>Project name:</strong> ' + projectNameError"></p>
    <p v-if="projectKeyError" class="text-sm text-red-500 italic" v-html="'<strong>PROJECT KEY:</strong> ' + projectKeyError"></p>

    <div class="flex justify-center">
      <Button variant="outline" @click="submit">Save</Button>
    </div>
  </div>
</template>
