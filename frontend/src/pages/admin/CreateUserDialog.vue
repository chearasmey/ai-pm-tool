<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth.store";

// shadcn/vue components (adjust import paths to your project)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { UserRoleEnum } from "@/types/role";
import { UserService } from "@/api/user.api";
import { toastStore } from "@/components/ui/toast/toast.store";


type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  role: UserRoleEnum;
};

const props = defineProps<{
  open: boolean;
  mode: "create" | "update";
  user?: AdminUser | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const auth = useAuthStore();

const title = computed(() => (props.mode === "create" ? "Create user" : "Update user"));
const submitLabel = computed(() => (props.mode === "create" ? "Create" : "Save"));

const form = reactive({
  email: "",
  name: "",
  role: UserRoleEnum.USER,
});

const loading = ref(false);
const apiError = ref<string | null>(null);
const createdPassword = ref<string | null>(null);
const copied = ref(false);

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;

    apiError.value = null;
    createdPassword.value = null;
    copied.value = false;

    if (props.mode === "update" && props.user) {
      form.email = props.user.email;
      form.name = props.user.name ?? "";
      form.role = props.user.role;
    } else {
      form.email = "";
      form.name = "";
      form.role = UserRoleEnum.USER;
    }
  },
  { immediate: true }
);

const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()));
const canSubmit = computed(() => {
  if (!form.email.trim() || !isValidEmail.value) return false;
  if (!form.role) return false;
  if (!form.name) return false;
  if (props.mode === "update" && !props.user?.id) return false;
  return true;
});

async function copyPassword() {
  if (!createdPassword.value) return;
  await navigator.clipboard.writeText(createdPassword.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1200);
}

function close() {
  emit("close");
}

async function submit() {
  if (!canSubmit.value || loading.value) return;

  loading.value = true;
  apiError.value = null;

  try {
    const payload: any = {
      email: form.email.trim(),
      name: form.name.trim() ? form.name.trim() : undefined,
      role: form.role,
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    };

    if (props.mode === "create") {
        const {data: response, status} = await UserService.createSystemUser(payload);
        console.log(response, status);
        if(status === 201) {
            createdPassword.value = response.data.defaultPassword;
        }

      emit("saved"); // refresh list
      // keep dialog open to show password
      return;
    }

    // update
    const userId = props.user!.id;

    await UserService.updateSystemUser(userId, payload);
    emit("saved");
    close();
    toastStore.show("Update user successfully", "success");
  } catch (e: any) {
    apiError.value = e?.message || "Something went wrong";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(v:boolean)=>!v && close()">
    <DialogContent class="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <div
          v-if="apiError"
          class="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {{ apiError }}
        </div>

        <!-- If created password exists, show it prominently -->
        <div
          v-if="mode === 'create' && createdPassword"
          class="rounded-lg border bg-muted/30 p-3"
        >
          <div class="text-sm font-semibold">Default password</div>
          <div class="mt-1 flex items-center gap-2">
            <code class="px-2 py-1 rounded bg-muted text-sm select-all">{{
              createdPassword
            }}</code>
            <Button type="button" variant="outline" size="sm" @click="copyPassword">
              {{ copied ? "Copied" : "Copy" }}
            </Button>
          </div>
          <div class="mt-2 text-xs text-muted-foreground">
            Copy and send to the user securely. This password is shown only once.
          </div>
        </div>

        <div v-if="!createdPassword">
            <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="user@example.com"
                :disabled="loading"
            />
            <div v-if="form.email && !isValidEmail" class="text-xs text-destructive">
                Invalid email format
            </div>
            </div>

            <div class="grid gap-2">
            <Label for="name">Name</Label>
            <Input
                id="name"
                v-model="form.name"
                type="text"
                placeholder="Full name"
                :disabled="loading"
            />
            </div>

            <div class="grid gap-2">
            <Label>Role</Label>

            <!-- ✅ shadcn Select expects v-model on Select, not SelectValue -->
            <Select v-model="form.role">
                <SelectTrigger class="w-full">
                <SelectValue placeholder="Select role" />
                </SelectTrigger>

                <SelectContent>
                <SelectItem value="normal">USER</SelectItem>
                <SelectItem value="project_admin">PROJECT_ADMIN</SelectItem>
                <SelectItem value="system_admin">SYSTEM_ADMIN</SelectItem>
                </SelectContent>
            </Select>

            <div class="text-xs text-muted-foreground">
                SYSTEM_ADMIN can manage users and system settings.
            </div>
            </div>
        </div>

      </div>

      <DialogFooter v-if="!createdPassword" class="mt-6 flex items-center justify-between gap-2">
        <Button type="button" variant="outline" :disabled="loading" @click="close"
          >Cancel</Button
        >

        <div class="flex items-center gap-2">
          <Button type="button" :disabled="loading || !canSubmit" @click="submit">
            {{ loading ? "Saving..." : submitLabel }}
          </Button>

          <!-- After create, allow admin to close explicitly -->
          <Button
            v-if="mode === 'create' && createdPassword"
            type="button"
            variant="secondary"
            :disabled="loading"
            @click="close"
          >
            Done
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
