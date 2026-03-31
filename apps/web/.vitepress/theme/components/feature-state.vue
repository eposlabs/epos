<script setup lang="ts">
import CardDescription from './card-description.vue'
import CardTitle from './card-title.vue'
import Card from './card.vue'
import Snippet from './snippet.vue'

const snippet = `
const state = await epos.state.connect()

// Every change is automatically synced across all contexts
state.items = []
state.items.push('Hello world!')
`.trim()
</script>

<template>
  <Card>
    <CardTitle>Shared State That Feels Like Magic</CardTitle>
    <CardDescription>
      Work with state as if it were a normal JavaScript object. Epos automatically keeps it in sync across all contexts in
      real time.
    </CardDescription>
    <Snippet title="state" lang="javascript" :code="snippet" />
  </Card>
</template>
