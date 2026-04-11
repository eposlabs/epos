<script setup lang="ts">
import Cta from './cta.vue'
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'
</script>

<template>
  <Card class="flex flex-col md:items-center md:py-20 md:text-center">
    <CardTitle class="md:text-4xl xl:text-5xl">Start building with Epos</CardTitle>
    <CardDescription class="max-w-2xl!">Install Epos and build your next extension.</CardDescription>
    <Cta />
  </Card>
</template>
