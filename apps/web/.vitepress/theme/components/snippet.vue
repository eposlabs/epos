<script setup lang="ts">
const props = defineProps<{
  title: string
  lang: 'javascript' | 'json'
  code: string
}>()
</script>

<template>
  <div class="">
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div class="flex gap-2">
        <div class="size-2.5 rounded-full bg-zinc-300"></div>
        <div class="size-2.5 rounded-full bg-zinc-300"></div>
        <div class="size-2.5 rounded-full bg-zinc-300"></div>
      </div>
      <div>{{ props.title }}</div>
    </div>
    <div class="">
      <pre :data-lang="props.lang" class="text-main">{{ props.code }}</pre>
    </div>
  </div>
</template>
