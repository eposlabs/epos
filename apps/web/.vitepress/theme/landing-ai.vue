<script setup lang="ts">
import { createHighlighter } from 'shiki'
import { useData } from 'vitepress'
import { nextTick, onMounted, watch } from 'vue'

// import snippetEposJson from './snippets/epos.json?raw'
// import snippetBus from './snippets/bus.js?raw'
// import stateSnippet from './snippets/state.js?raw'
// import storageSnippet from './snippets/storage.js?raw'

const { isDark } = useData()

watch(isDark, async dark => {
  await nextTick()
  await highlight(dark)
})

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
    const lang = (el.getAttribute('data-lang') === 'js' ? 'javascript' : el.getAttribute('data-lang')) as
      | 'json'
      | 'javascript'
    el.setAttribute('data-code', code)
    el.innerHTML = highlighter.codeToHtml(code, { lang, theme: dark ? 'github-dark' : 'github-light' })
  })
}

onMounted(async () => {
  await nextTick()
  await highlight()
})

const steps = [
  { index: '01', title: 'Install', description: 'Install Epos from the Chrome Web Store.' },
  { index: '02', title: 'Connect', description: 'Connect a local project folder.' },
  { index: '03', title: 'Develop', description: 'Epos runs your code in the browser.' },
  { index: '04', title: 'Export', description: 'Click Export to get a ZIP bundle.' },
]

const contexts = ['Popup', 'Content script', 'Background', 'Options page', 'Side panel', 'Offscreen']

const buildingBlocks = [
  { title: 'Messaging', description: 'Request-response or event-driven communication across every runtime.' },
  { title: 'State', description: 'Reactive shared state with sync, persistence, and hot updates built in.' },
  { title: 'Storage', description: 'Simple file and key-value primitives for extension data and generated assets.' },
]

const guarantees = ['Zero config', 'Runs in-browser', 'Hot reload aware', 'ZIP export']

const storageNotes = [
  'Keep generated files, user data, or cached resources in one consistent API.',
  'Use the same storage helpers from popup, background, content scripts, and every other context.',
  'Move from local development to packaged output without rewriting your data layer.',
]
</script>

<style scoped>
@reference './custom.css';

.box {
  @apply grow p-12 md:p-8 sm:p-6;
}

.page-frame {
  width: min(100%, 80rem);
}

.row {
  @apply flex border-t border-divider;
}

.hero-col {
  width: 60%;
}

.half-col {
  width: 50%;
}

.button-row {
  @apply mt-8 flex gap-5;
}

.left-divider {
  @apply border-l border-divider;
}

.stack-divider {
  border-bottom: 0;
}

.split-content {
  @apply flex gap-10;
}

.eyebrow {
  @apply font-mono text-[11px] tracking-[0.32em] text-dim uppercase dark:text-zinc-400;
}

.prose {
  @apply text-lg leading-8 text-dim md:text-[15px] md:leading-7 *:[strong]:font-normal *:[strong]:text-main;
}

.h1 {
  @apply text-8xl font-medium tracking-tighter text-main md:text-5xl md:leading-[0.96] sm:text-[44px];
}

.h2 {
  @apply text-3xl font-medium tracking-tight text-main md:text-[28px] sm:text-2xl;
}

.button {
  @apply inline-flex items-center justify-center border border-black/20 px-8 py-3 text-base font-medium text-main transition md:w-full md:px-6;
}

.button-brand {
  @apply bg-brand text-black! hover:opacity-90;
}

.button-secondary {
  @apply hover:bg-zinc-100 dark:border-white/20 dark:hover:bg-zinc-800;
}

.panel {
  @apply rounded-3xl border border-black/10 bg-white/70 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5;
}

.mini-grid {
  @apply grid grid-cols-2 gap-4 md:grid-cols-1;
}

.mini-card {
  @apply rounded-2xl border border-divider bg-(--vp-c-bg-soft) p-4;
}

.pill {
  @apply rounded-full border border-divider px-3 py-1.5 text-sm text-main;
}

.code-frame {
  @apply mt-8 overflow-hidden rounded-3xl border border-divider bg-(--vp-c-bg-soft);
}

.code-header {
  @apply flex items-center justify-between border-b border-divider px-4 py-3 font-mono text-xs tracking-[0.2em] text-dim uppercase;
}

.code-dots {
  @apply flex gap-2;
}

.code-dots span {
  @apply h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600;
}

.highlight-wrap {
  @apply overflow-x-auto p-2;
}

.highlight-wrap :deep(pre) {
  @apply m-0! rounded-none! bg-transparent! p-5! text-[13px];
}

.step-item {
  @apply flex gap-6 py-1;
}

.step-index {
  @apply font-mono text-lg text-zinc-500;
}

.step-copy {
  @apply mt-2 text-sm leading-6 text-dim;
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

.inline-code :deep(code) {
  @apply rounded-none bg-transparent p-0 text-inherit;
}

@media (max-width: 999px) {
  .box {
    padding: 2rem;
  }

  .row,
  .split-content,
  .button-row {
    flex-direction: column;
  }

  .hero-col,
  .half-col {
    width: 100%;
  }

  .stack-divider {
    border-bottom: 1px solid var(--vp-c-divider);
  }

  .left-divider {
    border-left: 0;
  }

  .prose {
    font-size: 15px;
    line-height: 1.75rem;
  }

  .h1 {
    font-size: 3.5rem;
    line-height: 0.96;
  }

  .h2 {
    font-size: 1.75rem;
  }

  .button {
    width: 100%;
    padding-inline: 1.5rem;
  }

  .mini-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 499px) {
  .box {
    padding: 1.5rem;
  }

  .h1 {
    font-size: 2.75rem;
  }
}
</style>

<template>
  <div class="relative">
    <div class="lattice absolute inset-0 -top-16"></div>
    <div class="page-frame relative mx-auto max-w-7xl border-r border-l border-divider bg-(--vp-c-bg)">
      <div class="row">
        <div class="box hero-col stack-divider">
          <div class="eyebrow">WEB EXTENSION ENGINE</div>
          <h1 class="h1 mt-6">
            A better way to build browser
            <div class="sm:hidden"></div>
            extensions.
          </h1>
          <p class="prose mt-6 max-w-3xl">
            Epos gives you a <strong>zero-config</strong> workflow and <strong>powerful built-in features</strong> that work
            across every extension context without forcing you to wire the platform together by hand.
          </p>
          <div class="button-row">
            <a class="button button-brand" href="https://get.epos.dev" target="_blank" rel="noreferrer">Install Epos</a>
            <a class="button button-secondary" href="/guide">Get Started</a>
          </div>
          <div class="mini-grid mt-10">
            <div class="mini-card">
              <div class="eyebrow">WHY IT FEELS DIFFERENT</div>
              <p class="mt-4 text-base leading-7 text-main">
                Develop against the real extension runtime in the browser, not an approximation buried behind tooling.
              </p>
            </div>
            <div class="mini-card">
              <div class="eyebrow">WHAT YOU KEEP</div>
              <div class="mt-4 flex flex-wrap gap-2">
                <span v-for="item in guarantees" :key="item" class="pill">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="box">
          <div class="eyebrow">WORKFLOW</div>
          <div class="panel mt-8">
            <div class="step-item" v-for="(step, index) in steps" :key="step.index">
              <div class="flex flex-col items-center">
                <div class="step-index">{{ step.index }}</div>
                <div v-if="index < steps.length - 1" class="my-2.5 h-15 w-px bg-divider"></div>
              </div>
              <div>
                <h3 class="text-lg text-main">{{ step.title }}</h3>
                <div class="step-copy">{{ step.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="box half-col stack-divider">
          <h2 class="h2 mt-4">Extension runtime</h2>
          <p class="prose mt-6 max-w-2xl">
            Epos is a <span class="[text-decoration:line-through]">boilerplate</span>{{ ' ' }}
            <span class="[text-decoration:line-through]">framework</span>{{ ' ' }}
            <span class="[text-decoration:line-through]">bundler</span> <strong>web extension runtime</strong> that runs
            your code directly in the browser during development.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <span v-for="context in contexts" :key="context" class="pill">{{ context }}</span>
          </div>
        </div>

        <div class="box half-col left-divider">
          <h2 class="h2 mt-4">Powerful building blocks</h2>
          <p class="prose mt-6">
            <strong>Unified messaging</strong>, <strong>shared state</strong>, <strong>file storage</strong> and other
            features work out of the box in all contexts. No setup required.
          </p>
          <div class="mini-grid mt-8">
            <div v-for="item in buildingBlocks" :key="item.title" class="mini-card">
              <h3 class="text-lg text-main">{{ item.title }}</h3>
              <p class="mt-3 text-sm leading-6 text-dim">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="box half-col stack-divider">
          <h2 class="h2 mt-4">Simpler configuration through epos.json</h2>
          <p class="prose mt-6 max-w-3xl">
            Describe what should run and where it should load. Epos handles the packaging, wiring, and output structure from
            there.
          </p>
          <div class="code-frame max-w-2xl">
            <div class="code-header">
              <div class="code-dots"><span></span><span></span><span></span></div>
              <div>epos.json</div>
            </div>
            <div class="highlight-wrap">
              <pre class="highlight" data-lang="json">{{ snippetEposJson }}</pre>
            </div>
          </div>
        </div>

        <div class="box left-divider">
          <div class="eyebrow">DESIGNED FOR REAL SURFACES</div>
          <h2 class="h2 mt-6">One project, multiple execution contexts.</h2>
          <p class="prose mt-6 max-w-2xl">
            Popup UI, content scripts, background logic, and supporting pages all live in the same project without the usual
            setup tax.
          </p>
          <div class="mini-grid mt-8">
            <div class="mini-card">
              <div class="eyebrow">DEVELOPMENT</div>
              <p class="mt-3 text-base leading-7 text-main">
                Edit code, refresh, and see changes reflected across contexts.
              </p>
            </div>
            <div class="mini-card">
              <div class="eyebrow">DISTRIBUTION</div>
              <p class="mt-3 text-base leading-7 text-main">
                Export a production ZIP bundle when the extension is ready to ship.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="box split-content">
          <div class="max-w-xl">
            <h2 class="h2 mt-4">Unified messaging system.</h2>
            <p class="prose inline-code mt-6">
              <code>epos.bus</code> provides simple communication between all contexts with no setup. Just
              <code>epos.bus.send()</code> and <code>epos.bus.on()</code> to send and receive messages. It even works with
              hot module replacement, so your handlers will update in real time as you edit your code.
            </p>
            <div class="mini-grid mt-8">
              <div class="mini-card">
                <div class="eyebrow">EVENTS</div>
                <p class="mt-3 text-sm leading-6 text-dim">
                  Broadcast updates between runtime surfaces without custom bridges.
                </p>
              </div>
              <div class="mini-card">
                <div class="eyebrow">REQUESTS</div>
                <p class="mt-3 text-sm leading-6 text-dim">
                  Handle structured request-response flows when data needs to come back.
                </p>
              </div>
            </div>
          </div>

          <div class="code-frame flex-1">
            <div class="code-header">
              <div class="code-dots"><span></span><span></span><span></span></div>
              <div>bus.js</div>
            </div>
            <div class="highlight-wrap">
              <pre class="highlight" data-lang="javascript">{{ snippetBus }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="box half-col stack-divider">
          <h2 class="h2 mt-4">Shared state that feels like magic.</h2>
          <p class="prose mt-6">
            Epos gives you a reactive shared state. Use it like a normal JavaScript object, and Epos will keep it in sync
            across all contexts in real time with automatic persistence, so all state is restored on reload.
          </p>
          <div class="mini-grid mt-8">
            <div class="mini-card">
              <div class="eyebrow">SYNC</div>
              <p class="mt-3 text-sm leading-6 text-dim">
                Changes propagate across runtime surfaces without manual event plumbing.
              </p>
            </div>
            <div class="mini-card">
              <div class="eyebrow">PERSISTENCE</div>
              <p class="mt-3 text-sm leading-6 text-dim">
                Reload the extension and recover state automatically instead of rebuilding it yourself.
              </p>
            </div>
          </div>
        </div>

        <div class="box half-col left-divider">
          <div class="code-frame mt-0">
            <div class="code-header">
              <div class="code-dots"><span></span><span></span><span></span></div>
              <div>state.js</div>
            </div>
            <div class="highlight-wrap">
              <pre class="highlight" data-lang="javascript">{{ stateSnippet }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="box half-col stack-divider">
          <h2 class="h2 mt-4">Simple key-value storage for files and data</h2>
          <p class="prose mt-6 max-w-3xl">
            Store files, generated output, and everyday extension data through a single API that stays consistent across
            development and packaged builds.
          </p>
          <div class="mt-8 space-y-4">
            <div v-for="item in storageNotes" :key="item" class="panel p-4">
              <p class="text-sm leading-6 text-main">{{ item }}</p>
            </div>
          </div>
        </div>

        <div class="box half-col left-divider">
          <div class="code-frame mt-0">
            <div class="code-header">
              <div class="code-dots"><span></span><span></span><span></span></div>
              <div>storage.js</div>
            </div>
            <div class="highlight-wrap">
              <pre class="highlight" data-lang="javascript">{{ storageSnippet }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
