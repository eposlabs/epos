<script setup lang="ts">
// @ts-ignore
import snippetEposJson from './snippets/epos.json?raw'
// @ts-ignore
import snippetBusOn from './snippets/bus-on.js?raw'

import { createHighlighter } from 'shiki'

createHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: ['json', 'javascript'],
}).then(highlighter => {
  const highlight = (code: string, lang: 'json' | 'javascript') => {
    return highlighter.codeToHtml(code, { lang, theme: 'github-light' })
  }

  // document.querySelectorAll('.highlight').forEach(el => {
  //   const code = el.textContent || ''
  //   const lang = el.getAttribute('data-lang') as 'json' | 'javascript'
  //   el.innerHTML = highlight(code, lang)
  // })
})

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
      'matches': '<background>',
      'load': ['background.js'],
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
  @apply text-4xl font-medium tracking-tight text-main;
}

.button {
  @apply border px-11 py-2.5 text-base font-medium text-main;
}
.button-brand {
  @apply bg-brand text-black!;
}
.button-secondary {
  @apply transition hover:bg-zinc-100 dark:border-white/20 dark:hover:bg-zinc-800;
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
  <div class="mx-auto max-w-7xl border-r border-l border-divider">
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

    <!--
    <div class="flex border-t border-divider">
      <div class="box w-1/2">
        <div class="eyebrow">WHAT IS EPOS?</div>
        <h2 class="h2 mt-4">Extension runtime.</h2>
        <p class="prose mt-6 max-w-2xl">
          Epos is not a boilerplate, framework, or bundler. It's a <strong>web extension runtime</strong> that runs your
          local code directly in the browser during development.
        </p>
      </div>
      <div class="box w-1/2 border-l border-divider">
        <div class="eyebrow">BUILT-IN FEATURES</div>
        <h2 class="h2 mt-4">Powerful building blocks.</h2>
        <p class="prose mt-6">
          Epos comes with powerful features like <strong>unified messaging</strong>, <strong>shared state</strong> and
          <strong>file storage</strong> that work out of the box in all contexts. No setup required.
        </p>
      </div>
    </div>

    <div class="flex border-t border-divider">
      <div class="box flex flex-col items-center">
        <div class="eyebrow">SIMPLE SETUP</div>
        <h2 class="h2 mt-4">Reimagine extension development.</h2>
        <p class="prose mt-6 max-w-3xl">
          With Epos, you can develop your extension directly in the browser with zero setup. Just connect a local folder and
          Epos will run your code with hot module replacement, so you can see your changes in real time as you edit.
        </p>
        <div class="w-xl">
          <pre class="highlight" data-lang="json">{{ snippetEposJson }}</pre>
        </div>
      </div>
    </div>

    <div class="flex border-t border-divider">
      <div class="box flex">
        <div>
          <div class="eyebrow">MESSAGING</div>
          <h2 class="h2 mt-4">Unified messaging system.</h2>
          <p class="prose mt-6">
            <code>epos.bus</code> provides simple communication between all contexts with no setup. Just
            <code>epos.bus.send()</code> and <code>epos.bus.on()</code> to send and receive messages. It even works with hot
            module replacement, so your handlers will update in real time as you edit your code.
          </p>
        </div>

        <div class="flex flex-col">
          <pre class="highlight" data-lang="js">{{ snippetBusOn }}</pre>
          <pre class="highlight" data-lang="js">epos.bus.send('event', data)</pre>
        </div>
      </div>
    </div>

    <div class="flex border-t border-divider">
      <div class="box">
        <div class="eyebrow">SHARED STATE</div>
        <h2 class="h2 mt-4">Shared state that feels like magic.</h2>
        <p class="prose mt-6">
          Epos has powerful features like hot module replacement, cross-context communication, and unified APIs that work in
          all contexts. Spend less time on setup and more time building.
        </p>
      </div>
    </div>

    <div class="flex h-100 border-t border-divider"></div>
    -->
  </div>
</template>
