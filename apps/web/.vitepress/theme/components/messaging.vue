<script setup lang="ts">
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'
import Snippet from './snippet.vue'

const code = `
// In background:
epos.bus.on('math:sum', (a, b) => a + b)

// On web page:
const result = await epos.bus.send('math:sum', 1, 2)
`.trim()
</script>

<template>
  <Card>
    <CardTitle>Unified Messaging</CardTitle>
    <CardDescription>
      The simplest API for cross-context communication. Smart automatic routing. Works in every context.
    </CardDescription>
    <Snippet lang="javascript" :code="code" />
  </Card>
</template>
