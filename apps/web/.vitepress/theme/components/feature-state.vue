<script setup lang="ts">
import Feature from './feature.vue'
import Snippet from './snippet.vue'

const snippet = `
// Make changes in background:
const state = await epos.state.connect()
state.items = []
state.items.push('Hello world!')

// And they are reflected in the popup:
const state = await epos.state.connect()
state.items // ['Hello world!']
`.trim()
</script>

<template>
  <Feature title="Shared State" class="border-t">
    <template #description>
      Epos gives you a reactive shared state. Use it like a normal JavaScript object, and Epos will keep it in sync across
      all contexts in real time with automatic persistence, so all state is restored on reload.
    </template>

    <Snippet title="state" lang="javascript" :code="snippet" />
  </Feature>
</template>
