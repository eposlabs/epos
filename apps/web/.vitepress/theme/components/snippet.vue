<script setup lang="ts">
const props = defineProps<{
  title: string
  lang: 'javascript' | 'json'
  code: string
}>()
</script>

<template>
  <div class="max-w-2xl rounded-3xl border bg-zinc-50 dark:bg-zinc-900">
    <div class="flex items-center justify-between border-b px-6 py-3">
      <div class="flex gap-2">
        <div class="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
        <div class="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
        <div class="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
      </div>
      <div class="font-mono text-sm">{{ props.title }}</div>
    </div>
    <div class="p-6 text-base">
      <pre :data-lang="props.lang" class="text-main">{{ props.code }}</pre>
    </div>
  </div>
</template>
