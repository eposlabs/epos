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
</script>

<template>
  <div class="relative text-lg leading-8 text-dim **:[strong]:font-normal **:[strong]:text-main">
    <Highlighter />
    <Lattice />
    <div class="relative mx-auto max-w-page border-r border-l bg-(--vp-c-bg)">
      <Hero />
      <div class="flex flex-wrap">
        <FeatureRuntime />
        <FeatureOverview />
        <FeatureConfig />
        <FeatureBus />
        <FeatureState />
        <FeatureStorage />
      </div>
    </div>
  </div>
</template>
