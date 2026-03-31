<script setup lang="ts">
import Feature from './feature.vue'
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
  <Feature title="Simpler Configuration" class="border-t">
    <template #description>
      Describe <strong>which</strong> files to load and <strong>where</strong>. Epos automatically injects your code and
      sets up the environment.
    </template>

    <Snippet title="epos.json" lang="json" :code="code" />
  </Feature>
</template>
