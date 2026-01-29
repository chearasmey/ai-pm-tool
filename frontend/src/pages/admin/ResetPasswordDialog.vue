<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth.store";

// shadcn/vue components (adjust paths if yours differ)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { UserRoleEnum } from "@/types/role";
import { UserService } from "@/api/user.api";

type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  role: UserRoleEnum;
};

const props = defineProps<{
  open: boolean;
  user?: AdminUser | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "reset"): void;
}>();

const auth = useAuthStore();

const loading = ref(false);
const apiError = ref<string | null>(null);
const newPassword = ref<string | null>(null);
const copied = ref(false);

// Default recommended: disable MFA when admin resets password
const disableMfa = ref(true);

const title = computed(() => `Reset password`);
const subtitle = computed(() => (props.user ? `${props.user.email}` : ""));

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    apiError.value = null;
    newPassword.value = null;
    copied.value = false;
    disableMfa.value = true;
  },
  { immediate: true }
);

function close() {
  emit("close");
}

async function copyPassword() {
  if (!newPassword.value) return;
  await navigator.clipboard.writeText(newPassword.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1200);
}

async function submitReset() {
  if (!props.user?.id || loading.value) return;

  loading.value = true;
  apiError.value = null;

  try {

    const { data: response, status} = await UserService.resetPassword(props.user.id, { disableMfa: disableMfa.value});
    if(status === 200) {
        newPassword.value = response.data.newPassword;
    }

    emit("reset"); // refresh list
    // keep open to show password
  } catch (e: any) {
    apiError.value = e?.message || "Something went wrong";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(v:boolean)=>!v && close()">
    <DialogContent class="sm:max-w-[540px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <div class="text-xs text-muted-foreground mt-1" v-if="subtitle">
          {{ subtitle }}
        </div>
      </DialogHeader>

      <div class="space-y-4">
        <div
          v-if="apiError"
          class="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {{ apiError }}
        </div>

        <!-- Success result -->
        <div v-if="newPassword" class="rounded-lg border bg-muted/30 p-3">
          <div class="text-sm font-semibold">New password</div>

          <div class="mt-2 flex items-center gap-2">
            <code class="px-2 py-1 rounded bg-muted text-sm select-all">{{
              newPassword
            }}</code>
            <Button type="button" variant="outline" size="sm" @click="copyPassword">
              {{ copied ? "Copied" : "Copy" }}
            </Button>
          </div>

          <div class="mt-2 text-xs text-muted-foreground">
            This password is shown only once. Send it to the user securely. Refresh token
            is invalidated automatically.
          </div>
        </div>

        <!-- Options -->
        <div v-if="!newPassword" class="rounded-lg border p-3">
          <div class="text-sm font-semibold">Options</div>

          <div class="mt-3 flex items-start gap-3">
            <!-- Checkbox for shadcn: use :checked + @update:checked -->
            <Checkbox
              :checked="disableMfa"
              @update:checked="(v:boolean)=>disableMfa=v"
              id="disableMfa"
            />
            <div class="space-y-1">
              <Label for="disableMfa" class="text-sm">Disable MFA during reset</Label>
              <div class="text-xs text-muted-foreground">
                Recommended if the user lost access to the authenticator.
              </div>
            </div>
          </div>
        </div>

        <div v-if="!newPassword" class="text-xs text-muted-foreground">
          Resetting password will <b>invalidate refresh tokens</b>. If the user is
          currently logged in, they may stay until access token expires.
        </div>
      </div>

      <DialogFooter v-if="!newPassword" class="mt-6 flex items-center justify-between gap-2">
        <Button type="button" variant="outline" :disabled="loading" @click="close">
          {{ newPassword ? "Close" : "Cancel" }}
        </Button>

        <Button
          v-if="!newPassword"
          type="button"
          :disabled="loading || !user"
          @click="submitReset"
        >
          {{ loading ? "Resetting..." : "Reset Password" }}
        </Button>

        <!-- If password shown, allow quick "Done" -->
        <Button
          v-else
          type="button"
          variant="secondary"
          :disabled="loading"
          @click="close"
        >
          Done
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
