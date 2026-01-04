<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../stores/auth.store";
import { Button } from "@/components/ui/button";
import { toastStore } from "@/components/ui/toast/toast.store";

const auth = useAuthStore();

/* ---------------- MFA ---------------- */
const showMfaSetup = ref(false);
const otp = ref("");
const qrCodeUrl = ref<string | null>(null);
const secret = ref<string | null>(null);
const loadingMfa = ref(false);

/* ---------------- Password ---------------- */
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const loadingPassword = ref(false);
const isInvalidCode = ref(false);
const isPasswordMatch = ref(true);
const isUpdatePasswordError = ref(false);
const passwordUpdateError = ref("");

async function startEnableMfa() {
  loadingMfa.value = true;
  try {
    const { status, data: response } = await auth.generateMfa();
    if (status === 200) {
      qrCodeUrl.value = response.data.qrCode;
      secret.value = response.data.manualCode;
    }

    showMfaSetup.value = true;
  } finally {
    loadingMfa.value = false;
  }
}

async function verifyEnableMfa() {
  try {
    await auth.verifyMfa(otp.value);
    await auth.enableMfa();
    showMfaSetup.value = false;
    otp.value = "";
  } catch {
    isInvalidCode.value = true;
  }
}

async function disableMfa() {
  await auth.disableMfa();
}

async function updatePassword() {
  if (newPassword.value !== confirmPassword.value) {
    isPasswordMatch.value = false;
    return;
  }
  loadingPassword.value = true;
  try {
    await auth.updatePassword(currentPassword.value, newPassword.value);
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    isUpdatePasswordError.value = false;
    toastStore.show("Update password successfully", "success");
  } catch (error: any) {
    isUpdatePasswordError.value = true;
    if(error.code==="INVALID_PASSWORD"){
      passwordUpdateError.value = error.message;    
    }

    if(error.code==="VALIDATION_FAILED"){
      passwordUpdateError.value = Object.values(error.errors as Object)[0];    
    }
  } finally {
    loadingPassword.value = false;
    isPasswordMatch.value = true;
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-2xl font-semibold mb-6">Security</h1>

    <!-- ================= MFA ================= -->
    <section class="bg-white border rounded mb-6">
      <div class="p-4 border-b">
        <h2 class="font-medium">Multi-factor authentication</h2>
        <p class="text-sm text-gray-600">
          Add an extra layer of security to your account.
        </p>
      </div>

      <div class="p-4 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">
              Status:
              <span :class="auth.user?.mfaEnabled ? 'text-green-600' : 'text-gray-500'">
                {{ auth.user?.mfaEnabled ? "Enabled" : "Disabled" }}
              </span>
            </p>
          </div>

          <Button v-if="!auth.user?.mfaEnabled" @click="startEnableMfa" :disabled="loadingMfa">Enable MFA</Button>
          <Button v-else variant="destructive" @click="disableMfa">Disable MFA</Button>
        </div>

        <!-- MFA Setup -->
        <div
          v-if="showMfaSetup && !auth.user?.mfaEnabled"
          class="border rounded p-4 bg-gray-50"
        >
          <p class="font-medium mb-2">Set up authenticator app</p>

          <div class="flex gap-6">
            <img
              v-if="qrCodeUrl"
              :src="qrCodeUrl"
              alt="QR Code"
              class="w-40 h-40 border bg-white"
            />

            <div class="flex-1 space-y-2">
              <p class="text-sm text-gray-600">
                Scan this QR code using Google Authenticator.
              </p>

              <p class="text-xs text-gray-500">
                Manual key: <span class="font-mono">{{ secret }}</span>
              </p>

              <input v-model="otp" placeholder="Enter 6-digit code" class="input" />

              <p v-if="isInvalidCode" class="text-sm text-red-500 italic">
                Invalid Code, Please try again.
              </p>

              <button class="btn-primary" @click="verifyEnableMfa" :disabled="!otp">
                Verify
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= PASSWORD ================= -->
    <section class="bg-white border rounded">
      <div class="p-4 border-b">
        <h2 class="font-medium">Change password</h2>
        <p class="text-sm text-gray-600">
          Use a strong password that you don’t use elsewhere.
        </p>
      </div>

      <div class="p-4 space-y-4">
        <input
          type="password"
          v-model="currentPassword"
          placeholder="Current password"
          class="input"
        />

        <input
          type="password"
          v-model="newPassword"
          placeholder="New password"
          class="input"
        />

        <input
          type="password"
          v-model="confirmPassword"
          placeholder="Confirm new password"
          class="input"
        />

        <p v-if="!isPasswordMatch" class="text-sm italic text-red-500">
          Passwords not match!
        </p>

        <p v-if="isUpdatePasswordError && isPasswordMatch" class="text-sm italic text-red-500 px-4">
          <div v-if="!Array.isArray(passwordUpdateError)">
            {{ passwordUpdateError }}
          </div>
          <div v-else>
            <ul v-for="err in passwordUpdateError" class="list-disc">
              <li>{{ err }}</li>
            </ul>
          </div>
        </p>
        
        <Button @click="updatePassword">Update Password</Button>
      </div>
    </section>
  </div>
</template>
