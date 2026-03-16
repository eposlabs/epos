<script setup lang="ts">
const steps = [
  { index: '01', title: 'Install', description: 'Install Epos from the Chrome Web Store.' },
  { index: '02', title: 'Connect', description: 'Connect a local project folder.' },
  { index: '03', title: 'Develop', description: 'Epos runs your code in the browser.' },
  { index: '04', title: 'Export', description: 'Click Export to get a ZIP bundle.' },
]
</script>

<style scoped>
@reference '../custom.css';

.box {
  @apply grow border-divider p-7 sm:p-8 md:p-12;
}

.eyebrow {
  @apply font-mono text-[11px] tracking-[0.32em] text-dim uppercase dark:text-zinc-400;
}

.prose {
  @apply text-lg leading-8 text-dim *:[strong]:font-normal *:[strong]:text-main;
}

.h1 {
  @apply text-6xl font-medium tracking-tighter text-main sm:text-7xl md:text-8xl;
}
.h2 {
  @apply text-3xl tracking-normal text-main;
}
.h3 {
  @apply text-xl text-main;
}

.button {
  @apply border px-8 py-2 text-base font-medium text-main sm:px-11 sm:py-2.5;
}
.button-brand {
  @apply bg-brand text-black!;
}
.button-secondary {
  @apply transition hover:bg-zinc-100 dark:border-white/20 dark:hover:bg-zinc-800;
}

.code-block {
  @apply mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-5 text-zinc-900;
  @apply dark:border-zinc-800 dark:bg-black dark:text-white;
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

<template>
  <div class="mx-auto max-w-5xl xl:max-w-7xl">
    <div class="flex flex-col xl:flex-row">
      <div class="box border-t border-r lg:border-l xl:border-r-0">
        <div class="eyebrow">WEB EXTENSION ENGINE</div>
        <h1 class="h1 mt-6">
          A better way to
          <div class="hidden sm:block"></div>
          build browser
          <div class="hidden sm:block"></div>
          extensions.
        </h1>
        <div class="prose mt-6">
          Epos gives you a <strong>zero-config</strong> workflow and <strong>powerful built-in features</strong>
          <div class="hidden sm:block"></div>
          that work across all execution contexts with no extra setup.
        </div>
        <div class="mt-8 flex gap-5">
          <a class="button button-brand" href="https://get.epos.dev">Install Epos</a>
          <a class="button button-secondary" href="/guide">Get Started</a>
        </div>
      </div>
      <div class="box border-t border-r border-l xl:border-l-0">
        <div class="eyebrow">WORKFLOW</div>
        <div class="mt-8">
          <div class="flex" v-for="(step, index) in steps" :key="step.index">
            <div class="flex flex-col items-center">
              <div class="font-mono text-xl text-zinc-500">{{ step.index }}</div>
              <div class="my-2.5 h-15 w-px bg-divider" v-if="index < steps.length - 1"></div>
            </div>
            <div class="ml-7">
              <h3 class="h3">{{ step.title }}</h3>
              <div class="mt-2 text-sm text-dim">{{ step.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
