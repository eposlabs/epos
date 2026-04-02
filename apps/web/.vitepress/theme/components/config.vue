<script setup lang="ts">
import Snippet from './snippet.vue'
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'

const code = `
// The same API for every context:
// background, popup, side panel, web pages, iframes
import epos from 'epos'
`.trim()
</script>

<template>
  <Card>
    <CardTitle>Works Out of the Box</CardTitle>
    <CardDescription>
      Every feature works in every extension context. All required setup is handled automatically.
    </CardDescription>
    <Snippet lang="javascript" :code="code" />
  </Card>
</template>
