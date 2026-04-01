<script setup lang="ts">
import Cta from './cta.vue'
import CardDescription from './ui/card-description.vue'
import CardTitle from './ui/card-title.vue'
import Card from './ui/card.vue'
</script>

<template>
  <Card class="flex flex-col items-center py-20 text-center">
    <CardTitle class="flex items-center gap-4 text-5xl">Start building with Epos</CardTitle>
    <CardDescription class="max-w-2xl!">Install Epos and start building your next extension.</CardDescription>
    <Cta />
  </Card>
</template>
