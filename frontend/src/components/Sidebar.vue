<script setup lang="ts">
import SidebarItem from './SidebarItem.vue';
</script>
<template>
  <aside class="w-64 bg-white border-r overflow-y-auto">
    <nav class="p-3 space-y-4 text-sm">
      <SidebarItem icon="🏠" label="For you" to="/" :exact="true" />
      <SidebarItem icon="⭐" label="Starred" to="/starred" />

      <div class="text-xs text-gray-400 uppercase mt-4">Projects</div>
      <SidebarItem label="Scrum" to="/scrum" />
      <SidebarItem label="Kanban" to="/kanban" />
      <!-- <SidebarItem icon="⚙️" label="Settings" to="/settings" /> -->
    </nav>
  </aside>
</template>
