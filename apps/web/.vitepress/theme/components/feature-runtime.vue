<script setup lang="ts">
import CardDescription from './card-description.vue'
import CardTitle from './card-title.vue'
import Card from './card.vue'
import Feature from './feature.vue'
</script>

<template>
  <Card>
    <CardTitle>Extension Runtime</CardTitle>
    <CardDescription>
      Epos is a <span class="line-through">boilerplate</span>{{ ' ' }} <span class="line-through">framework</span>{{ ' ' }}
      <span class="line-through">bundler</span> <strong>web extension runtime</strong> that runs your code directly in the
      browser.
    </CardDescription>
  </Card>
</template>
