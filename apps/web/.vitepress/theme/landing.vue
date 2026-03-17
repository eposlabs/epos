<script setup lang="ts">
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

.code-block {
  @apply mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-5 text-zinc-900;
  @apply relative dark:border-zinc-800 dark:bg-black dark:text-white;
}
.code-label {
  @apply absolute top-2 right-2 font-mono text-sm text-zinc-500;
}
.code {
  @apply space-y-1 font-mono text-[15px] leading-7 text-zinc-900 dark:text-zinc-100;
}
.code-line {
  @apply min-h-7;
}
.code-line > div:not(.code-indent) {
  @apply inline;
}
.code-indent {
  @apply inline-block w-[2ch];
}
.code-comment {
  @apply text-zinc-400 dark:text-dim;
}
.code-keyword {
  @apply text-sky-700 dark:text-cyan-300;
}
.code-function {
  @apply text-blue-700 dark:text-sky-300;
}
.code-variable {
  @apply text-zinc-900 dark:text-zinc-100;
}
.code-property {
  @apply text-amber-700 dark:text-amber-200;
}
.code-string {
  @apply text-emerald-700 dark:text-emerald-300;
}
.code-number {
  @apply text-orange-700 dark:text-orange-300;
}
.code-boolean {
  @apply text-orange-700 dark:text-orange-300;
}
.code-operator {
  @apply text-zinc-600 dark:text-zinc-300;
}
.code-punctuation {
  @apply text-dim dark:text-zinc-400;
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
          <div class="code-block">
            <div class="code-label">background.ts</div>
            <div class="code">
              <div class="code-line">
                <div class="code-variable">epos</div>
                <div class="code-punctuation">.</div>
                <div class="code-property">bus</div>
                <div class="code-punctuation">.</div>
                <div class="code-function">on</div>
                <div class="code-punctuation">(</div>
                <div class="code-string">'event'</div>
                <div class="code-punctuation">,</div>
                <div> </div>
                <div class="code-variable">handler</div>
                <div class="code-punctuation">)</div>
              </div>
            </div>
          </div>

          <div class="code-block">
            <div class="code-label">content-script.ts</div>
            <div class="code">
              <div class="code-line">
                <div class="code-variable">epos</div>
                <div class="code-punctuation">.</div>
                <div class="code-property">bus</div>
                <div class="code-punctuation">.</div>
                <div class="code-function">send</div>
                <div class="code-punctuation">(</div>
                <div class="code-string">'event'</div>
                <div class="code-punctuation">,</div>
                <div> </div>
                <div class="code-variable">data</div>
                <div class="code-punctuation">)</div>
              </div>
            </div>
          </div>
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
  </div>
</template>
