<script lang="ts" setup>
import Toolbar from "primevue/toolbar";
import Button from "primevue/button";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import SplitButton from "primevue/splitbutton";
</script>

<template>
  <Toolbar
    class="absolute bottom-0 left-0 right-0 top-0 z-10 mx-auto flex h-min w-fit items-center justify-center shadow-lg"
    style="border-top-left-radius: 0%; border-top-right-radius: 0%"
  >
    <template #start>
      <Button icon="pi pi-plus" class="mr-2" severity="secondary" />
      <Button icon="pi pi-print" class="mr-2" severity="secondary" />
      <Button icon="pi pi-upload" severity="secondary" />
    </template>

    <template #center>
      <IconField icon-position="left">
        <InputIcon>
          <i class="pi pi-search" />
        </InputIcon>
        <InputText placeholder="Search" />
      </IconField>
    </template>

    <template #end> <SplitButton label="Save"></SplitButton></template>
  </Toolbar>
</template>

<style scoped lang="postcss"></style>
