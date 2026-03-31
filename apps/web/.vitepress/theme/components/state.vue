<script setup lang="ts">
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'
import Snippet from './snippet.vue'

const code = `
const state = await epos.state.connect()

// Modify like a regular object.
// All changes are synced real-time!
state.items = []
state.items.push('Hello world!')
`.trim()
</script>

<template>
  <Card>
    <CardTitle>State with Real-Time Sync</CardTitle>
    <CardDescription>Modify your state in one context, see the changes in all other contexts instantly.</CardDescription>
    <Snippet lang="javascript" :code="code" />
  </Card>
</template>
