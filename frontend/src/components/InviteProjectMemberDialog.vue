<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Check, ChevronsUpDown } from "lucide-vue-next";

interface User {
  id: number;
  name: string;
  email: string;
}

const props = defineProps<{
  open: boolean;
  users: User[];
}>();

const emit = defineEmits(["close", "invite"]);

const selectedUsers = ref<number[]>([]);
const role = ref<"member" | "admin">("member");

const toggleUser = (id: number) => {
  selectedUsers.value.includes(id)
    ? (selectedUsers.value = selectedUsers.value.filter((u) => u !== id))
    : selectedUsers.value.push(id);
};

const onClose = () => {
    emit('close');
    selectedUsers.value = [];
    role.value = "member";
}

const submit = () => {
  emit("invite", {
    userIds: selectedUsers.value,
    role: role.value,
  });
  selectedUsers.value = [];
  role.value = "member";
};

</script>

<template>
  <Dialog :open="open" @update:open="onClose">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Invite members</DialogTitle>
      </DialogHeader>

      <!-- User Multi Select -->
      <div class="space-y-2">
        <label class="text-sm font-medium" for="invite-popover">Select users</label>

        <Popover id="invite-popover">
          <PopoverTrigger as-child>
            <Button variant="outline" class="w-full justify-between">
              {{
                selectedUsers.length ? `${selectedUsers.length} selected` : "Choose users"
              }}
              <ChevronsUpDown class="w-4 h-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent class="w-75 p-2">
            <div class="max-h-48 overflow-y-auto space-y-1">
              <div
                v-for="user in users"
                :key="user.id"
                @click="toggleUser(user.id)"
                class="flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-muted"
              >
                <div>
                  <p class="text-sm">{{ user.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                </div>
                <Check v-if="selectedUsers.includes(user.id)" class="w-4 h-4" />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <!-- Role Select -->
      <div class="space-y-2">
        <label class="text-sm font-medium" for="select-people">Project role</label>
        <Select id="select-people" v-model="role">
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="onClose">Cancel</Button>
        <Button :disabled="!selectedUsers.length" @click="submit"> Save </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
