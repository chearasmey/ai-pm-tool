<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../stores/auth.store";
import { useRouter } from "vue-router";

const otp = ref("");
const auth = useAuthStore();
const router = useRouter();

</script>
<template></template>
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-6 rounded shadow w-96">
      
    </div>
  </div>
</template>