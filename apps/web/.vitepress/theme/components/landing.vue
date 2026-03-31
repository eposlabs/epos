<script setup lang="ts">
import { createHighlighter } from 'shiki'
import { useData } from 'vitepress'
import { watch } from 'vue'

import Eyebrow from './eyebrow.vue'
import Hero from './hero.vue'
import Lattice from './lattice.vue'
import FeatureRuntime from './feature-runtime.vue'
import FeatureOverview from './feature-overview.vue'
import FeatureConfig from './feature-config.vue'
import FeatureBus from './feature-bus.vue'
import FeatureStorage from './feature-storage.vue'
import FeatureState from './feature-state.vue'
import Highlight from './highlight.vue'

const { isDark } = useData()

watch(isDark, dark => highlight(dark))

let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null

const highlight = async (dark?: boolean) => {
  if (typeof document === 'undefined') return
  dark ??= document.documentElement.classList.contains('dark')

  highlighter ??= await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: ['json', 'javascript'],
  })

  document.querySelectorAll('.highlight').forEach(el => {
    if (!highlighter) return
    const code = el.getAttribute('data-code') || el.textContent || ''
    const lang = el.getAttribute('data-lang') as 'json' | 'javascript'
    el.setAttribute('data-code', code)
    el.innerHTML = highlighter.codeToHtml(code, { lang, theme: dark ? 'github-dark' : 'github-light' })
  })
}

if (typeof document !== 'undefined') {
  void highlight()
}

const spec = {
  'name': 'My Extension',
  'targets': [
    {
      'matches': '*://*.example.com/*',
      'load': ['main.css', 'main.js'],
    },
    {
      'matches': '<popup>',
      'load': ['popup.css', 'popup.js'],
    },
    {
      'load': ['background.js'],
      'matches': '<background>',
    },
  ],
}
</script>

<style scoped>
@reference '../custom.css';
code {
  @apply rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-800;
}
</style>

<template>
  <div class="relative text-lg leading-8 text-dim **:[strong]:font-normal **:[strong]:text-main">
    <Highlight />
    <Lattice />
    <div class="relative mx-auto max-w-page border-r border-l bg-(--vp-c-bg)">
      <Hero />
      <FeatureRuntime />
      <FeatureOverview />
      <FeatureConfig />
      <FeatureBus />
      <FeatureState />
      <FeatureStorage />
    </div>
  </div>
</template>
