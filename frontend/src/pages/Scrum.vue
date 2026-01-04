<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { UserRole } from "@/types/role";
import { hasRole } from "@/utils/permission";
const auth = useAuthStore();
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
</template>
