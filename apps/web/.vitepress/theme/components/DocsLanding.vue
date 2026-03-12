<script setup lang="ts">
const features = [
  {
    title: 'Cross-context messaging',
    description: 'Use one messaging API across popup, background, side panel, web pages, and frames.',
    href: '/guide/messaging',
  },
  {
    title: 'Shared state',
    description: 'Keep data synchronized across contexts and persist it between sessions.',
    href: '/guide/state',
  },
  {
    title: 'Extension APIs',
    description: 'Use supported chrome.* APIs in web pages and iframes through one consistent API surface.',
    href: '/guide/extension',
  },
  {
    title: 'Storage for data and files',
    description: 'Store JSON, blobs, and files in persistent IndexedDB-backed storage.',
    href: '/guide/storage',
  },
  {
    title: 'Assets and frames',
    description: 'Load bundled assets and work with hidden background frames when you need a real page context.',
    href: '/guide/assets',
  },
  {
    title: 'Simple project config',
    description: 'Describe where code should load in epos.json and let Epos generate the final manifest for you.',
    href: '/guide/epos-json',
  },
]

const steps = [
  {
    number: '01',
    title: 'Install',
    description: 'Install Epos from Chrome Web Store.',
  },
  {
    number: '02',
    title: 'Connect a folder',
    description: 'Link a local project folder.',
  },
  {
    number: '03',
    title: 'Develop',
    description: 'Epos executes your code in the browser.',
  },
  {
    number: '04',
    title: 'Export',
    description: 'Click Export and get ZIP bundle.',
  },
]
</script>

<template>
  <div class="docs-landing-shell bg-white text-black dark:bg-[#16171d] dark:text-white">
    <section class="docs-section border-b border-zinc-200 py-12 sm:py-16 lg:py-20 dark:border-zinc-800">
      <div class="grid gap-10 lg:grid-cols-[auto_auto] lg:gap-16">
        <div class="max-w-4xl">
          <div class="font-mono text-[11px] tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-400">
            WEB EXTENSION ENGINE
          </div>

          <h1
            :class="[
              'mt-6 max-w-5xl text-5xl font-medium tracking-tighter text-black',
              'sm:text-6xl lg:text-8xl dark:text-white',
            ]"
          >
            A better way to build browser extensions.
          </h1>

          <p class="mt-6 max-w-150 text-base leading-8 text-zinc-600 sm:text-lg dark:text-zinc-300">
            Epos provides a <span class="font-medium text-black dark:text-white">zero-config</span> experience and
            <span class="font-medium text-black dark:text-white">powerful features</span> designed to work across all
            execution contexts with no extra setup.
          </p>

          <div class="mt-8 flex flex-wrap gap-4">
            <a
              :class="[
                'bg-brand inline-flex items-center justify-center border px-9 py-3',
                'text-sm font-medium text-black transition',
              ]"
              href="https://get.epos.dev"
            >
              Install Epos
            </a>
            <a
              :class="[
                'inline-flex items-center justify-center border px-9 py-3',
                'text-sm font-medium text-black transition hover:border-black hover:bg-zinc-100',
                'dark:border-zinc-700 dark:text-white dark:hover:border-white dark:hover:bg-zinc-900',
              ]"
              href="/guide/basics"
            >
              Get Started
            </a>
            <a
              :class="[
                'inline-flex items-center justify-center border px-9 py-3',
                'text-sm font-medium text-black transition hover:border-black hover:bg-zinc-100',
                'dark:border-zinc-700 dark:text-white dark:hover:border-white dark:hover:bg-zinc-900',
              ]"
              href="/api"
            >
              API Reference
            </a>
          </div>
        </div>

        <div>
          <div class="pl-2 font-mono text-[11px] tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-400">
            WORKFLOW
          </div>

          <div class="mt-8">
            <div
              v-for="(step, index) in steps"
              :key="`hero-${step.number}`"
              class="grid first:*:pt-2 last:*:pb-2 sm:grid-cols-[88px_1fr]"
              :class="index > 0 ? 'border-t border-zinc-200 dark:border-zinc-800' : ''"
            >
              <div
                :class="[
                  'py-6 pr-5 pl-2 font-mono text-xl text-zinc-500',
                  'sm:border-r sm:border-zinc-200 dark:text-zinc-400 dark:sm:border-zinc-800',
                ]"
              >
                {{ step.number }}
              </div>
              <div class="px-5 py-6">
                <h3 class="text-xl font-medium tracking-[-0.04em]">{{ step.title }}</h3>
                <p :class="['mt-3 text-sm leading-7 text-nowrap text-zinc-600', 'dark:text-zinc-300']">
                  {{ step.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="docs-section border-b border-zinc-200 py-12 sm:py-16 lg:py-20 dark:border-zinc-800">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div :class="['font-mono text-[11px] tracking-[0.32em] text-zinc-500 uppercase', 'dark:text-zinc-400']">
            Features
          </div>
          <h2 class="mt-4 text-3xl font-medium tracking-[-0.06em] sm:text-5xl">What Epos gives you.</h2>
        </div>
      </div>

      <div
        :class="[
          'mt-10 grid gap-px border border-zinc-200 bg-zinc-200 md:grid-cols-2 xl:grid-cols-3',
          'dark:border-zinc-800 dark:bg-zinc-800',
        ]"
      >
        <a
          v-for="feature in features"
          :key="feature.title"
          :href="feature.href"
          :class="['group bg-white p-8 transition hover:bg-zinc-50', 'dark:bg-black dark:hover:bg-zinc-950']"
        >
          <h3 class="text-xl font-medium tracking-[-0.04em] text-black dark:text-white">{{ feature.title }}</h3>
          <p class="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{{ feature.description }}</p>
          <div :class="['mt-5 font-mono text-[11px] tracking-[0.24em] text-black uppercase', 'dark:text-white']">
            Open Guide →
          </div>
        </a>
      </div>
    </section>

    <!--
    <section class="docs-section border-b border-zinc-200 py-12 sm:py-16 lg:py-20 dark:border-zinc-800">
      <div class="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <div>
          <div class="font-mono text-[11px] tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-400">What Epos is</div>
          <h2 class="mt-4 text-3xl font-medium tracking-[-0.06em] sm:text-5xl">
            An extension for building other extensions.
          </h2>
        </div>

        <div class="space-y-6 text-base leading-8 text-zinc-700 sm:text-lg dark:text-zinc-300">
          <p>Epos is not a CLI starter and not a bundle of presets. The engine itself runs as a browser extension.</p>
          <p>
            That lets it keep the development loop inside the browser: you edit local files, Epos watches the project, and
            matching code is executed in the right extension contexts.
          </p>
          <p>
            When the project is ready, Epos exports a standard Manifest V3 bundle that you can test and publish normally.
          </p>
        </div>
      </div>
    </section>

    <section class="docs-section border-b border-zinc-200 py-12 sm:py-16 lg:py-20 dark:border-zinc-800">
      <div class="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
        <div>
          <div class="font-mono text-[11px] tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-400">Workflow</div>
          <h2 class="mt-4 text-3xl font-medium tracking-[-0.06em] sm:text-5xl">
            Install. Connect a folder. Code executes.
          </h2>
          <p class="mt-6 max-w-xl text-base leading-8 text-zinc-700 sm:text-lg dark:text-zinc-300">
            The workflow is deliberately short. Epos removes most of the setup between creating a folder and seeing code run
            in the browser.
          </p>
        </div>

        <div class="grid gap-px border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
          <div
            v-for="step in steps"
            :key="step.number"
            class="grid gap-px bg-zinc-200 sm:grid-cols-[88px_1fr] dark:bg-zinc-800"
          >
            <div class="bg-black p-5 font-mono text-xl text-white dark:bg-white dark:text-black">
              {{ step.number }}
            </div>
            <div class="bg-white p-5 dark:bg-black">
              <h3 class="text-xl font-medium tracking-[-0.04em]">{{ step.title }}</h3>
              <p class="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="docs-section py-12 sm:py-16 lg:py-20">
      <div
        class="grid gap-px border border-zinc-200 bg-zinc-200 lg:grid-cols-[1fr_auto] dark:border-zinc-800 dark:bg-zinc-800"
      >
        <div class="bg-white p-6 sm:p-8 dark:bg-black">
          <div class="font-mono text-[11px] tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-400">Start here</div>
          <h2 class="mt-4 text-3xl font-medium tracking-[-0.06em] sm:text-4xl">
            Learn the workflow first, then go deeper where needed.
          </h2>
          <p class="mt-4 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg dark:text-zinc-300">
            Start with the basics for the shortest path to a working extension. Then move to the feature guides and API
            reference as the project grows.
          </p>
        </div>

        <div class="grid gap-px bg-zinc-200 sm:grid-cols-3 lg:min-w-72 lg:grid-cols-1 dark:bg-zinc-800">
          <a
            class="bg-white px-5 py-4 text-sm font-medium transition hover:bg-zinc-50 dark:bg-black dark:hover:bg-zinc-950"
            href="/guide/basics"
            >Basics Guide</a
          >
          <a
            class="bg-white px-5 py-4 text-sm font-medium transition hover:bg-zinc-50 dark:bg-black dark:hover:bg-zinc-950"
            href="/guide/features"
            >Features Overview</a
          >
          <a
            class="bg-white px-5 py-4 text-sm font-medium transition hover:bg-zinc-50 dark:bg-black dark:hover:bg-zinc-950"
            href="/api"
            >API Reference</a
          >
        </div>
      </div>
    </section>

    -->
  </div>
</template>
