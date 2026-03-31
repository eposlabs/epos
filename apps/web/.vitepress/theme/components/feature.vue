<script setup lang="ts">
const props = defineProps<{
  title: string
}>()
</script>

<template>
  <div>
    <h2 class="text-2xl font-medium tracking-tight text-main">
      {{ props.title }}
    </h2>
    <p class="mt-4 max-w-2xl">
      <slot />
    </p>
  </div>
</template>
