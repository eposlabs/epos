<script setup lang="ts">
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'
import Snippet from './snippet.vue'

const code = `
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "*://*.example.com/*",
      "load": ["main.css", "main.js"]
    },
    {
      "matches": "<popup>",
      "load": ["popup.css", "popup.js"]
    },
    {
      "matches": "<background>",
      "load": ["background.js"]
    }
  ]
}
`.trim()
</script>

<template>
  <Card>
    <CardTitle>Simple Setup</CardTitle>
    <CardDescription>Just describe which files to load and where.</CardDescription>
    <Snippet title="epos.json" lang="json" :code="code" />
  </Card>
</template>
