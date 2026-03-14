<script setup lang="ts">
const steps = [
  {
    number: '01',
    title: 'Install',
    description: 'Install Epos from the Chrome Web Store.',
  },
  {
    number: '02',
    title: 'Connect',
    description: 'Connect a local project folder.',
  },
  {
    number: '03',
    title: 'Develop',
    description: 'Epos runs your code in the browser.',
  },
  {
    number: '04',
    title: 'Export',
    description: 'Click Export to get a ZIP bundle.',
  },
]

const featureSections = [
  {
    eyebrow: 'Bus',
    title: 'Unified messaging system.',
    bullets: ['Works in EVERY contexts.', 'Automatic routing.', 'Supports files and binary data.'],
    code: ['// Send', "epos.bus.send('event', data)", '', '// Listen', "epos.bus.on('event', handler)"],
  },
  {
    eyebrow: 'State',
    title: 'Shared state that feels like normal object.',
    bullets: [
      'Connect once and work with one shared object across contexts.',
      'Read and write state directly with normal objects and arrays.',
      'Changes sync automatically, so updates in background appear in popup right away.',
      'State is persisted and restored when the browser opens again.',
    ],
    code: [
      '// Connect',
      'const state = epos.state.connect()',
      '',
      '// Modify',
      "state.user = { name: 'Alex' }",
      'state.items = []',
      "state.items.push({ id: 1, name: 'Item 1' })",
    ],
  },
  {
    eyebrow: 'Storage',
    title: 'Simple key-value storage for files and data.',
    bullets: [
      'Use epos.storage for files, blobs, and heavier persistent data.',
      'Save data in one context and read it back in another.',
      'Backed by IndexedDB, so it handles more than simple key-value strings.',
      'A good fit for data that should persist but does not need reactive updates.',
    ],
    code: [
      '// Store',
      "await epos.storage.set('profile-pic', imageBlob)",
      '',
      '// Load',
      "const imageBlob = await epos.storage.get('profile-pic')",
    ],
  },
]
</script>

<style scoped>
@reference '../custom.css';

.box {
  @apply shrink-0 grow border-zinc-200 p-18;
}

.eyebrow {
  @apply font-mono text-[11px] tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-400;
}

.prose {
  @apply text-lg leading-8 text-zinc-600;
  @apply *:[strong]:font-medium *:[strong]:text-black;
}

.h1 {
  @apply text-8xl font-medium tracking-tighter text-black dark:text-white;
}

.h2 {
  @apply text-5xl font-medium tracking-tight;
}

.h3 {
  @apply text-xl font-medium tracking-tight;
}

.button {
  @apply border px-9 py-3 text-sm font-medium text-black transition hover:bg-zinc-100;
}
</style>

<template>
  <div class="docs-landing-shell">
    <div class="docs-section p-0!">
      <div class="box flex border-r border-b border-l">
        <!-- Hero -->
        <div class="w-[62%]">
          <div class="eyebrow">WEB EXTENSION ENGINE</div>
          <h1 class="h1 mt-6">A better way to build browser extensions.</h1>
          <div class="prose mt-6">
            Epos gives you a <strong>zero-config</strong> workflow and <strong>powerful built-in features</strong>
            <div></div>
            that work across all execution contexts with no extra setup.
          </div>
          <div class="mt-8 flex gap-4">
            <a class="button bg-brand hover:bg-brand!" href="https://get.epos.dev">Install Epos</a>
            <a class="button" href="/guide">Get Started</a>
            <a class="button" href="/api">API Reference</a>
          </div>
        </div>

        <!-- Workflow -->
        <div class="ml-auto pr-15">
          <div class="eyebrow">WORKFLOW</div>
          <div class="mt-8 space-y-10">
            <div v-for="(step, index) in steps" :key="step.number" class="relative flex items-start gap-7">
              <div class="relative flex shrink-0 justify-center">
                <div
                  v-if="index < steps.length - 1"
                  class="absolute top-9 left-1/2 h-[calc(100%+2rem)] w-px -translate-x-1/2 bg-zinc-300 dark:bg-zinc-700"
                />
                <div
                  class="relative -top-1.5 z-10 flex h-12 items-center justify-center rounded-full bg-white font-mono text-[19px]"
                >
                  <div class="relative inline-block leading-none">
                    <div class="text-zinc-600">{{ step.number }}</div>
                    <!-- <div class="absolute top-1/2 left-full -translate-y-1/2">.</div> -->
                  </div>
                </div>
              </div>
              <div class="pt-1">
                <h3 class="h3">{{ step.title }}</h3>
                <div class="mt-2 text-sm leading-7 text-nowrap text-zinc-600 dark:text-zinc-300">
                  {{ step.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Why Epos -->
      <div class="box space-y-4 border-r border-b border-l">
        <div class="eyebrow">WHY EPOS?</div>
        <h2 class="h2">Reimagine extension development.</h2>
        <p class="prose max-w-2xl">
          Epos is a browser extension for building other browser extensions. Connect a local folder, describe what should
          load, and start with the hard parts already handled for you.
        </p>
      </div>

      <!-- Messaging -->
      <div class="box space-y-4 border-r border-b border-l">
        <div class="eyebrow">MESSAGING</div>
        <h2 class="h2">Unified messaging system.</h2>
      </div>
      <div class="flex">
        <div class="box border-b border-l">
          <ul class="prose list-inside list-disc">
            <li>one</li>
            <li>two</li>
          </ul>
        </div>
        <div class="box border-r border-b border-l">
          <div class="code">const bus = epos.bus.connect()</div>
        </div>
      </div>

      <!-- State -->
      <div class="box space-y-4">
        <div class="eyebrow">STATE</div>
        <h2 class="h2">Shared state that feels like magic.</h2>
      </div>
    </div>
  </div>

  <div class="docs-landing-shell bg-white text-black dark:bg-[#16171d] dark:text-white">
    <section class="docs-section border-b border-zinc-200 p-0! dark:border-zinc-800">
      <section
        v-for="(feature, index) in featureSections"
        :key="feature.eyebrow"
        class="border-x border-b border-zinc-200 dark:border-zinc-800"
      >
        <div class="grid lg:grid-cols-2">
          <div class="border-b border-zinc-200 px-6 py-10 sm:px-8 sm:py-12 lg:col-span-2 dark:border-zinc-800">
            <div class="font-mono text-[11px] tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-400">
              {{ feature.eyebrow }}
            </div>
            <p class="mt-5 max-w-full text-4xl leading-tight font-medium tracking-[-0.06em] sm:text-5xl">
              {{ feature.title }}
            </p>
          </div>

          <div
            :class="[
              'border-t border-zinc-200 px-6 py-10 sm:px-8 sm:py-12 lg:border-t-0 dark:border-zinc-800',
              index % 2 === 1 ? 'lg:order-2 lg:border-l' : 'lg:border-r',
            ]"
          >
            <ul class="space-y-4 text-base leading-8 text-zinc-600 sm:text-lg dark:text-zinc-300">
              <li v-for="point in feature.bullets" :key="point" class="flex gap-4">
                <span class="shrink-0 text-xl leading-8 text-zinc-400 dark:text-zinc-500">•</span>
                <span>{{ point }}</span>
              </li>
            </ul>
          </div>

          <div
            :class="[
              'border-t border-zinc-200 px-6 py-10 sm:px-8 sm:py-12 lg:border-t-0 dark:border-zinc-800',
              index % 2 === 1 ? 'lg:order-1' : '',
            ]"
          >
            <pre
              class="overflow-x-auto text-lg leading-8 sm:text-xl sm:leading-9"
            ><code class="whitespace-pre">{{ feature.code.join('\n') }}</code></pre>
          </div>
        </div>
      </section>
    </section>

    <!--
    <section class="mt-8 border border-zinc-200 dark:border-zinc-800">
      <div class="bg-white px-6 py-10 sm:px-8 sm:py-12 dark:bg-black">
        <div class="font-mono text-[11px] tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-400">
          Constraints
        </div>
        <p class="mt-5 max-w-2xl text-xl leading-8 text-zinc-600 sm:text-2xl dark:text-zinc-300">
          Epos is opinionated on purpose. It is built for one modern extension stack.
        </p>
        <div class="mt-5 space-y-3 text-2xl font-medium tracking-[-0.05em] sm:text-3xl">
          <p>React only</p>
          <p>Chromium only</p>
          <p>Manifest V3 only</p>
        </div>

        <a
          :class="[
            'mt-8 inline-flex items-center justify-center border px-9 py-3',
            'text-sm font-medium text-black transition hover:border-black hover:bg-zinc-100',
            'dark:border-zinc-700 dark:text-white dark:hover:border-white dark:hover:bg-zinc-900',
          ]"
          href="/guide"
        >
          Get Started
        </a>
      </div>
    </section>
    -->

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
