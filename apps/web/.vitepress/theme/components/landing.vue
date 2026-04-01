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
    <div class="relative mx-auto min-h-[calc(100vh-var(--vp-nav-height))] max-w-page bg-(--vp-c-bg) md:border-x">
      <Hero class="border-t" />
      <Runtime class="border-t" />
      <div class="xl:flex">
        <Setup class="border-t xl:w-1/2" />
        <Features class="border-t xl:w-1/2 xl:border-l" />
      </div>
      <div class="xl:flex">
        <Messaging class="border-t xl:w-1/2" />
        <State class="border-t xl:w-1/2 xl:border-l" />
      </div>
      <div class="xl:flex">
        <Storage class="border-t xl:w-1/2" />
        <Config class="border-t xl:w-1/2 xl:border-l" />
      </div>
      <Start class="border-t" />
      <Footer class="border-t" />
    </div>
  </div>
</template>
