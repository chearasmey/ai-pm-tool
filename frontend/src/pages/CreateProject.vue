<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/api/project.api";
import type { ProjectTypeEnum } from "@/types/projectTypeEnum";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { generateProjectKey } from "@/utils/projectKey";

const props = defineProps<{
  type: ProjectTypeEnum;
}>();

const router = useRouter();

const form = ref({
  name: "",
  projectKey: "",
  description: "",
});

async function submit() {
  await createProject({
    ...form.value,
    type: props.type,
  });
  router.push("/projects");
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
          <BreadcrumbPage>Project</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    </div>
    <div class="m-auto max-w-xl space-y-6 bg-white p-3 rounded-sm">
      <h1 class="text-xl font-semibold text-center">{{ type.toLocaleUpperCase() }} Project</h1>
      <Input v-model="form.name" placeholder="Project name" />
      <Input v-model="form.projectKey" placeholder="PROJECT KEY" />
      <p class="text-xs text-muted-foreground">
        Generated from project name (you can edit)
      </p>
      <Textarea v-model="form.description" placeholder="Description" />

      <div class="flex justify-center">
        <Button @click="submit">Create</Button>
      </div>
    </div>
 
</template>
