<script setup lang="ts">
const props = defineProps<{ title: string }>()
</script>

<template>
  <div class="w-1/2 border-r p-12">
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
