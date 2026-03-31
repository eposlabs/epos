<script setup lang="ts">
const props = defineProps<{ title: string }>()
</script>

<template>
  <div class="p-12">
    <h2 class="text-2xl font-medium tracking-tight text-main">
      {{ props.title }}
    </h2>
    <p class="mt-6 max-w-2xl">
      <slot name="description" />
    </p>
    <div v-if="$slots.default" class="mt-6">
      <slot />
    </div>
  </div>
</template>
