<script setup lang="ts">
import { createHighlighter } from 'shiki'
import { useData } from 'vitepress'
import { watch } from 'vue'
import FeatureBus from './feature-bus.vue'
import FeatureConfig from './feature-config.vue'
import FeatureOverview from './feature-overview.vue'
import FeatureRuntime from './feature-runtime.vue'
import FeatureState from './feature-state.vue'
import FeatureStorage from './feature-storage.vue'
import Hero from './hero.vue'
import Highlighter from './highlighter.vue'
import Lattice from './lattice.vue'
import Separator from './separator.vue'
</script>

<template>
  <div
    :class="[
      'relative text-lg leading-8 text-dim',
      '**:[code]:rounded-lg **:[code]:bg-zinc-100 **:[code]:px-2 **:[code]:py-1 **:[code]:font-mono **:[code]:text-main',
      '**:[strong]:font-normal **:[strong]:text-main',
    ]"
  >
    <Highlighter />
    <Lattice />
    <div class="relative mx-auto min-h-[calc(100vh-var(--vp-nav-height))] max-w-page border-r border-l bg-(--vp-c-bg)">
      <Hero class="border-t" />
      <div class="flex border-t">
        <FeatureRuntime class="w-1/2" />
        <FeatureOverview class="w-1/2 border-l" />
      </div>
      <FeatureConfig class="border-t" />
      <FeatureBus class="border-t" />
      <FeatureState class="border-t" />
      <FeatureStorage class="border-t" />
    </div>
  </div>
</template>
