<script setup lang="ts">
import Feature from './feature.vue'
import Snippet from './snippet.vue'

const snippet = `
await epos.storage.set('file', file)
const file = await epos.storage.get('file')
`.trim()
</script>

<template>
  <Feature title="Storage for Files and Data" class="border-t">
    <template #description>
      Epos provides a simple API for storing files and data. Use <code>epos.storage.set()</code> to save data and
      <code>epos.storage.get()</code> to retrieve it.
    </template>

    <Snippet title="storage" lang="javascript" :code="snippet" />
  </Feature>
</template>
