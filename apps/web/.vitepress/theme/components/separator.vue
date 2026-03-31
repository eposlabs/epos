<script setup lang="ts">
const props = defineProps<{
  vertical?: boolean
}>()
</script>

<template>
  <div :class="['shrink-0 bg-divider', props.vertical ? 'w-px self-stretch' : 'h-px w-full']" />
</template>
