<script setup lang="ts">
import { Button } from "@/components/ui/button";
</script>
<template>
  <div class="flex justify-between">
    <h1 class="text-2xl font-semibold mb-4 uppercase">Scrum</h1>
    <Button as-child>
      <router-link to="/scrum/create">Create</router-link>
    </Button>
  </div>
</template>
