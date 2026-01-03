<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import { Plus } from "lucide-vue-next";
import {Button} from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const router = useRouter();
const authStore = useAuthStore();
const logout = async () => {
  await authStore.logout();
  router.push("/login");
};
</script>
<template>
  <header class="h-14 bg-white border-b flex justify-between items-center px-4 gap-4">
    <div class="font-bold text-blue-600">
      <a href="/">AI PM</a>
    </div>

    <div class="hidden md:flex justify-between gap-2 w-1/2 bg-amber-50">
      <Input placeholder="Search" />
      <Button>
        <plus />
        Create
      </Button>
    </div>

    <div class="flex items-center gap-1">
      <router-link
        to="/settings"
        title="Settings"
        class="hover:bg-gray-100 p-1 hover:rounded-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </router-link>
      <img
        alt="avatar"
        class="w-8 h-8 rounded-full cursor-pointer hover:bg-gray-100 p-1"
        src="https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/63a2d1a56f068efec8f512be/1ba98fe4-e067-4812-a769-e8d1af79c909/128"
      />
      <a
        href="#"
        @click="logout"
        title="Logout"
        class="hover:bg-gray-100 p-1 hover:rounded-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
          />
        </svg>
      </a>
    </div>
  </header>
</template>
