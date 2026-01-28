<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store';
import SidebarItem from './SidebarItem.vue';
import { UserRoleEnum } from '@/types/role';
const auth = useAuthStore();
</script>
<template>
  <aside class="w-64 bg-white border-r overflow-y-auto">
    <nav class="p-3 space-y-4 text-sm">
      <SidebarItem icon="🏠" label="For you" to="/" :exact="true" />
      <SidebarItem icon="⭐" label="Starred" to="/starred" />

      <div class="text-xs text-gray-400 uppercase mt-4">Projects</div>
      <SidebarItem label="Scrum" to="/scrum" />
      <SidebarItem label="Kanban" to="/kanban" />

      <div v-if="auth.user?.role==UserRoleEnum.SYSTEM_ADMIN">
        <div class="text-xs text-gray-400 uppercase mt-4">User Management</div>
        <SidebarItem label="Users" to="/users" class="mt-4" />
      </div>

      <div v-if="auth.user?.role==UserRoleEnum.SYSTEM_ADMIN">
        <div class="text-xs text-gray-400 uppercase mt-4">Settings</div>
        <SidebarItem label="Build Semantic" to="/semantic" class="mt-4" />
      </div>

    </nav>
  </aside>
</template>
