<script setup lang="ts">
import Feature from './feature.vue'
import Snippet from './snippet.vue'

const snippet = `
// In background:
epos.bus.on('event', handler)

// On web page:
epos.bus.send('event', data)
`.trim()
</script>

<template>
  <Feature title="Unified Messaging" class="border-t">
    <template #description>
      <p>
        <code>epos.bus</code> provides simple communication between all contexts with no setup. Just
        <code>epos.bus.send()</code> and <code>epos.bus.on()</code> to send and receive messages. It even works with hot
        module replacement, so your handlers will update in real time as you edit your code.
      </p>
    </template>

    <Snippet title="bus" lang="javascript" :code="snippet" />
  </Feature>
</template>
