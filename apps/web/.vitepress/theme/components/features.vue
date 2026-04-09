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
        <li><strong>Cross-context messaging</strong> with smart routing</li>
        <li><strong>Reactive state</strong> with automatic sync</li>
        <li><strong>State persistence</strong> in IndexedDB</li>
        <li><strong>File and data storage</strong></li>
        <li><strong>Automatic code injection</strong></li>
        <li><strong>Preconfigured Shadow DOM</strong></li>
        <li><strong>Simple React integration</strong></li>
        <li><strong>CORS-free fetch</strong> for web pages</li>
        <li><strong>Extension APIs</strong> in every context</li>
        <li><strong>Invisible web pages</strong> for background automation</li>
        <li><strong>Granular updates</strong> without a full reload</li>
        <li><strong>Dedicated project dashboard</strong></li>
        <li><strong>One-click export</strong></li>
        <li><strong>And plenty more!</strong></li>
      </ul>
    </CardDescription>
  </Card>
</template>
