<script setup lang="ts">
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'
</script>

<template>
  <Card class="flex flex-col items-center py-20 text-center">
    <CardTitle class="flex items-center gap-4 text-5xl">Extension Runtime</CardTitle>
    <CardDescription class="max-w-2xl!">
      Epos is not a boilerplate, framework, or bundler. It is a <strong>web extension runtime</strong> that runs your code
      directly in the browser during development.
    </CardDescription>
  </Card>
</template>
