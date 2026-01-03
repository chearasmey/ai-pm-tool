<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../stores/auth.store";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const auth = useAuthStore();
const router = useRouter();
const isMfaEnabled = ref(false);
const isError = ref(false);
const errorMessage = ref("");
const otp = ref("");

const submit = async () => {
  isError.value = false;
  if (otp.value) {
    try {
      await auth.login(email.value, password.value, otp.value);
      console.log(auth);
      router.push("/");
    } catch (error: any) {
      console.log(error);
      const errorData = error.response.data;
      isError.value = true;
      errorMessage.value = errorData.message;
    }
  } else {
    try {
      await auth.login(email.value, password.value);
      console.log(auth);
      router.push("/");
    } catch (error: any) {
      console.log(error);
      const errorData = error.response.data;
      if (errorData.code === "OTP_REQUIRED") {
        isMfaEnabled.value = true;
      } else {
        isError.value = true;
        errorMessage.value = errorData.message;
      }
    }
  }
};
</script>

<template>
  <div
    class="min-h-screen w-full px-3 md:px-0 flex items-center justify-center bg-gray-100"
  >
    <div v-if="!isMfaEnabled" class="bg-white p-6 rounded shadow w-96">
      <h1 class="text-xl font-bold mb-4 text-center uppercase">AI PM Tool</h1>

      <input v-model="email" class="input" placeholder="Email" />
      <input
        v-model="password"
        type="password"
        class="input mt-2"
        placeholder="Password"
      />

      <div v-if="isError" class="text-center py-2 italic text-red-600">
        {{ errorMessage }}
      </div>
      <button @click="submit" class="btn-primary w-full" :class="{ 'mt-4': !isError }">
        Login
      </button>
    </div>
    <div v-else class="bg-white p-6 rounded shadow w-96">
      <h1 class="text-xl font-bold mb-4 text-center uppercase">AI PM Tool</h1>

      <input v-model="otp" class="input" placeholder="OTP 6-digit" />
      <div v-if="isError" class="text-center py-2 italic text-red-600">
        {{ errorMessage }}
      </div>
      <button @click="submit" class="btn-primary w-full" :class="{ 'mt-4': !isError }">
        Submit
      </button>
    </div>
  </div>
</template>
