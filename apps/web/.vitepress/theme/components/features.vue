<script setup lang="ts">
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'
</script>

<template>
  <Card>
    <CardTitle>Powerful Features</CardTitle>
    <CardDescription>
      <ul class="mt-4 flex list-inside list-disc flex-col gap-1">
        <li>Unified messaging</li>
        <li>Auto-sync state</li>
        <li>State persistence</li>
        <li>File storage</li>
        <li>Automatic code injection</li>
        <li>Preconfigured Shadow DOM</li>
        <li>Simple React integration</li>
        <li>CORS-free fetch for web pages</li>
        <li>Browser APIs in all contexts</li>
        <li>Background web pages</li>
        <li>Granular reloading</li>
        <li>Dedicated project dashboard</li>
        <li>One-click export</li>
        <li>And much more...</li>
      </ul>
    </CardDescription>
  </Card>
</template>
