<script lang="ts" setup>
import Button from "primevue/button";
import ConfirmDialog from "primevue/confirmdialog";
import IcBaselineWarningAmber from "~icons/ic/baseline-warning-amber";

// Format the message to replace \n with <br> for multi-line support
function formattedMessage(message: string): string {
  if (message) {
    return message.replace(/\n/g, "<br>");
  }
  return "";
}
</script>

<template>
  <ConfirmDialog>
    <template #container="{ message, acceptCallback, rejectCallback }">
      <div class="flex flex-col items-center p-8">
        <!-- Icon if provided by message.icon -->
        <!-- <div v-if="message.icon" class="icon-wrapper" v-html="message.icon" /> -->

        <div v-if="message.icon" class="icon-wrapper">
          <component :is="message.icon" width="75px" height="75px" />
        </div>

        <!-- Default icon -->
        <IcBaselineWarningAmber v-else width="75px" height="75px" />

        <!-- Header -->
        <span class="mb-2 mt-6 block text-2xl font-bold">
          {{ message.header }}
        </span>

        <!-- Message -->
        <p
          class="mb-0"
          style="text-align: center"
          v-html="formattedMessage(message.message)"
        ></p>

        <!-- Buttons -->
        <div class="mt-6 flex items-center gap-2">
          <Button
            :label="message.acceptLabel"
            @click="acceptCallback"
            class="w-32"
            :class="message.acceptClass"
          />
          <Button
            :label="message.rejectLabel"
            @click="rejectCallback"
            class="w-32"
            :class="message.rejectClass"
          />
        </div>
      </div>
    </template>
  </ConfirmDialog>
</template>
