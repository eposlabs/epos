<script setup lang="ts">
import CardDescription from './card-description.vue'
import CardTitle from './card-title.vue'
import Card from './card.vue'
import Snippet from './snippet.vue'

const snippet = `
// Store file
await epos.storage.set('user-pic', imageFile)

// Access later
const pic = await epos.storage.get('user-pic')
`.trim()
</script>

<template>
  <Card>
    <CardTitle>Storage for Files and Data</CardTitle>
    <CardDescription>
      Storage your app files and data with a simple <code>get()</code> and <code>set()</code> API. Powered by IndexedDB.
    </CardDescription>
    <Snippet title="storage" lang="javascript" :code="snippet" />
  </Card>
</template>
