<script setup lang="ts">
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'
</script>

<template>
  <Card class="flex flex-col md:items-center md:py-20 md:text-center">
    <CardTitle class="md:text-4xl xl:text-5xl">Extension Runtime</CardTitle>
    <CardDescription class="max-w-2xl!">
      Epos is not a boilerplate, framework, or bundler. It is a <strong>web extension runtime</strong> that runs your code
      directly in the browser during development.
    </CardDescription>
  </Card>
</template>
