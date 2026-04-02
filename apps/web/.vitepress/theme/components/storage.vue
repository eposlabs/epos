<script setup lang="ts">
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'
import Snippet from './snippet.vue'

const code = `
// Store in background:
await epos.storage.set('user-pic', imageFile)

// Access later in popup:
const pic = await epos.storage.get('user-pic')
`.trim()
</script>

<template>
  <Card>
    <CardTitle>Storage for Files and Data</CardTitle>
    <CardDescription class="max-w-md">
      Store and access files and data from any context. Powered by IndexedDB.
    </CardDescription>
    <Snippet lang="javascript" :code="code" />
  </Card>
</template>
