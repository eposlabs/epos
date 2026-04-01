<script setup lang="ts">
import Config from './config.vue'
import Features from './features.vue'
import Footer from './footer.vue'
import Hero from './hero.vue'
import Highlighter from './highlighter.vue'
import Lattice from './lattice.vue'
import Messaging from './messaging.vue'
import Runtime from './runtime.vue'
import Setup from './setup.vue'
import Start from './start.vue'
import State from './state.vue'
import Storage from './storage.vue'
</script>

<template>
  <div class="relative text-lg leading-8 text-dim">
    <Highlighter />
    <Lattice />
    <div class="relative mx-auto min-h-[calc(100vh-var(--vp-nav-height))] max-w-page border-r border-l bg-(--vp-c-bg)">
      <Hero class="border-t" />
      <Runtime class="border-t" />
      <div class="flex">
        <Setup class="w-1/2 border-t" />
        <Features class="w-1/2 border-t border-l" />
      </div>
      <div class="flex">
        <Messaging class="w-1/2 border-t" />
        <State class="w-1/2 border-t border-l" />
      </div>
      <div class="flex">
        <Storage class="w-1/2 border-t" />
        <Config class="w-1/2 border-t border-l" />
      </div>
      <Start class="border-t" />
      <Footer class="border-t" />
    </div>
  </div>
</template>
