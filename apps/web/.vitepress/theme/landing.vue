<script setup lang="ts">
import { createHighlighter } from 'shiki'
import { useData } from 'vitepress'
import { watch } from 'vue'

import snippetEposJson from './snippets/epos.json?raw'
import snippetBus from './snippets/bus.js?raw'
import stateSnippet from './snippets/state.js?raw'
import storageSnippet from './snippets/storage.js?raw'

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

const steps = [
  { index: '01', title: 'Install', description: 'Install Epos from the Chrome Web Store.' },
  { index: '02', title: 'Connect', description: 'Connect a local project folder.' },
  { index: '03', title: 'Develop', description: 'Epos runs your code in the browser.' },
  { index: '04', title: 'Export', description: 'Click Export to get a ZIP bundle.' },
]
</script>

<style scoped>
@reference './custom.css';

.box {
  @apply grow p-12;
}

.eyebrow {
  @apply font-mono text-[11px] tracking-[0.32em] text-dim uppercase dark:text-zinc-400;
}

.prose {
  @apply text-lg leading-8 text-dim *:[strong]:font-normal *:[strong]:text-main;
}

.h1 {
  @apply text-8xl font-medium tracking-tighter text-main;
}
.h2 {
  @apply text-3xl font-medium tracking-tight text-main;
}

.button {
  @apply border border-black/20 px-11 py-2.25 text-base font-medium text-main;
}
.button-brand {
  @apply bg-brand text-black!;
}
.button-secondary {
  @apply transition hover:bg-zinc-100 dark:border-white/20 dark:hover:bg-zinc-800;
}

.lattice {
  --lattice-size: 32px;
  --lattice-color: var(--vp-c-gutter);
  background-image:
    linear-gradient(to right, var(--lattice-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--lattice-color) 1px, transparent 1px);
  background-size: var(--lattice-size) var(--lattice-size);
  opacity: 0.2;
}

code {
  @apply rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-800;
}
</style>

<style>
@reference './custom.css';

.Layout:not(:has(.has-sidebar)) {
  .VPNav {
    @apply relative mx-auto max-w-7xl border-x border-divider;
  }
  .VPNav .content-body {
    @apply m-0 p-0;
  }
  .VPNav .divider {
    @apply hidden;
  }
  .VPContent {
    @apply pt-0;
  }
}
</style>

<template>
  <div class="relative">
    <div class="lattice absolute inset-0 -top-16"></div>
    <div class="relative mx-auto max-w-7xl border-r border-l border-divider bg-(--vp-c-bg)">
      <div class="flex border-t border-divider">
        <div class="box w-[60%]">
          <div class="eyebrow">WEB EXTENSION ENGINE</div>
          <h1 class="h1 mt-6">
            A better way to
            <div class="sm:hidden"></div>
            build browser
            <div class="sm:hidden"></div>
            extensions.
          </h1>
          <div class="prose mt-6">
            Epos gives you a <strong>zero-config</strong> workflow and <strong>powerful built-in features</strong>
            <div class="sm:hidden"></div>
            that work across all execution contexts with no extra setup.
          </div>
          <div class="mt-8 flex gap-5">
            <a class="button button-brand" href="https://get.epos.dev">Install Epos</a>
            <a class="button button-secondary" href="/guide">Get Started</a>
          </div>
        </div>
        <div class="box">
          <div class="eyebrow">WORKFLOW</div>
          <div class="mt-8">
            <div class="flex" v-for="(step, index) in steps" :key="step.index">
              <div class="flex flex-col items-center">
                <div class="font-mono text-lg text-zinc-500">{{ step.index }}</div>
                <div class="my-2.5 h-15 w-px bg-divider" v-if="index < steps.length - 1"></div>
              </div>
              <div class="ml-7">
                <h3 class="text-lg text-main">{{ step.title }}</h3>
                <div class="mt-2 text-sm text-dim">{{ step.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex border-t border-divider">
        <div class="box w-1/2">
          <h2 class="h2 mt-4">Extension runtime</h2>
          <p class="prose mt-6 max-w-2xl">
            Epos is a <span class="[text-decoration:line-through]">boilerplate</span>{{ ' ' }}
            <span class="[text-decoration:line-through]">framework</span>{{ ' ' }}
            <span class="[text-decoration:line-through]">bundler</span> <strong>web extension runtime</strong> that runs
            your code directly in the browser during development.
          </p>
        </div>
        <div class="box w-1/2 border-l border-divider">
          <h2 class="h2 mt-4">Powerful building blocks</h2>
          <p class="prose mt-6">
            <strong>Unified messaging</strong>, <strong>shared state</strong>, <strong>file storage</strong> and other
            features work out of the box in all contexts. No setup required.
          </p>
        </div>
      </div>

      <div class="flex border-t border-divider">
        <div class="box w-[50%]">
          <h2 class="h2 mt-4">Simpler configuration through epos.json</h2>
          <p class="prose mt-6 max-w-3xl">Just tell which files to load and where, and Epos will take care of the rest.</p>
          <div class="w-xl">
            <pre class="highlight" data-lang="json">{{ snippetEposJson }}</pre>
          </div>
        </div>
        <div class="box border-l border-divider"></div>
      </div>

      <div class="flex border-t border-divider">
        <div class="box flex">
          <div>
            <h2 class="h2 mt-4">Unified messaging system.</h2>
            <p class="prose mt-6">
              <code>epos.bus</code> provides simple communication between all contexts with no setup. Just
              <code>epos.bus.send()</code> and <code>epos.bus.on()</code> to send and receive messages. It even works with
              hot module replacement, so your handlers will update in real time as you edit your code.
            </p>
          </div>

          <div class="flex flex-col">
            <pre class="highlight" data-lang="js">{{ snippetBus }}</pre>
          </div>
        </div>
      </div>

      <div class="flex border-t border-divider">
        <div class="box">
          <h2 class="h2 mt-4">Shared state that feels like magic.</h2>
          <p class="prose mt-6">
            Epos gives you a reactive shared state. Use it like a normal JavaScript object, and Epos will keep it in sync
            across all contexts in real time with automatic persistence, so all state is restored on reload.
          </p>
          <pre class="highlight" data-lang="js">{{ stateSnippet }}</pre>
        </div>
      </div>

      <div class="flex border-t border-divider">
        <div class="box">
          <h2 class="h2 mt-4">Simple key-value storage for files and data</h2>
          <p class="prose mt-6">// TODO</p>
          <pre class="highlight" data-lang="js">{{ storageSnippet }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
