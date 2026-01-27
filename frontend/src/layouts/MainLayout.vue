<script setup lang="ts">
import TopNav from "../components/TopNav.vue";
import Sidebar from "../components/Sidebar.vue";
import GlobalSearchDialog from "@/components/GlobalSearchDialog.vue";


</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <TopNav />
    <GlobalSearchDialog />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar />
      <main class="flex-1 overflow-y-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
