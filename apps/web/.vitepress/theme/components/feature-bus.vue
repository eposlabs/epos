<script setup lang="ts">
import CardDescription from './card-description.vue'
import CardTitle from './card-title.vue'
import Card from './card.vue'
import Snippet from './snippet.vue'

const snippet = `
// In background:
epos.bus.on('math:sum', (a, b) => a + b)

// On web page:
const result = await epos.bus.send('math:sum', 1, 2)
`.trim()
</script>

<template>
  <Card>
    <CardTitle>Unified Messaging</CardTitle>
    <CardDescription> Simple API for cross-context communication with <strong>automatic routing</strong> </CardDescription>
    <Snippet title="bus" lang="javascript" :code="snippet" />
  </Card>
</template>
