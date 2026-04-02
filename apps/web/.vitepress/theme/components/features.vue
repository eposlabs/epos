<script setup lang="ts">
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'
</script>

<template>
  <Card>
    <CardTitle>Powerful Features</CardTitle>
    <CardDescription>
      <ul class="mt-4 flex list-disc flex-col gap-1 pl-4.5 *:pl-2">
        <li>Cross-context messaging with auto routing</li>
        <li>Reactive state with automatic synchronization</li>
        <li>State persistence to IndexedDB</li>
        <li>File storage for files and data</li>
        <li>Automatic code injection</li>
        <li>Preconfigured Shadow DOM</li>
        <li>Simple React integration</li>
        <li>CORS-free fetch for web pages</li>
        <li>Browser APIs support for every extension context</li>
        <li>Invisible web pages for background automation</li>
        <li>Granular reloading without full extension reload</li>
        <li>Dedicated project dashboard</li>
        <li>One-click export</li>
        <li>And plenty more!</li>
      </ul>
    </CardDescription>
  </Card>
</template>
