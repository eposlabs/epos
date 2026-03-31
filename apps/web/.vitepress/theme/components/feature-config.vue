<script setup lang="ts">
import CardDescription from './card-description.vue'
import CardTitle from './card-title.vue'
import Card from './card.vue'
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
    <CardTitle>Simpler Configuration</CardTitle>
    <CardDescription>
      Describe <strong>which</strong> files to load and <strong>where</strong>. Epos automatically injects your code and
      sets up the environment.
    </CardDescription>
    <Snippet title="epos.json" lang="json" :code="code" />
  </Card>
</template>
