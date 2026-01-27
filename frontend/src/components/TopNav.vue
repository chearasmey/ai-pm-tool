<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import { LogOut, Settings } from "lucide-vue-next";
import { Input } from "@/components/ui/input";
import { ref } from "vue";
import { bus } from "@/events/bus";

const router = useRouter();
const auth = useAuthStore();
const searchInput = ref("");

const openSearchDialog = () => {
  bus.emit("search:open", { initialQuery: searchInput.value });
};
const logout = async () => {
  await auth.logout();
  router.push("/login");
};
</script>
<template>
  <header class="h-14 bg-white border-b flex justify-between items-center px-4 gap-4">
    <div class="font-bold text-blue-600">
      <a href="/">AI PM</a>
    </div>

    <div class="hidden md:flex justify-between gap-2 w-1/2 bg-amber-50">
      <Input
        v-model="searchInput"
        placeholder="Search (Ctrl + K)"
        @focus="openSearchDialog"
        @keydown.enter.prevent="openSearchDialog"
      />
    </div>

    <div class="flex items-center gap-1">
      <router-link
        to="/settings"
        title="Settings"
        class="hover:bg-gray-100 p-1 hover:rounded-sm"
      >
        <Settings />
      </router-link>
      <img
        alt="avatar"
        :title="auth.user?.email"
        class="w-8 h-8 rounded-full cursor-pointer hover:bg-gray-100 p-1"
        src="https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/63a2d1a56f068efec8f512be/1ba98fe4-e067-4812-a769-e8d1af79c909/128"
      />
      <a
        href="#"
        @click="logout"
        title="Logout"
        class="hover:bg-gray-100 p-1 hover:rounded-sm"
      >
        <LogOut />
      </a>
    </div>
  </header>
</template>
