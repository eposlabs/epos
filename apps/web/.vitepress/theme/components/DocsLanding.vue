<script setup lang="ts">
type SnippetTokenKind = 'plain' | 'keyword' | 'string' | 'property' | 'function' | 'number' | 'comment'

type SnippetToken = {
  text: string
  kind?: SnippetTokenKind
}

const snippetToken = (text: string, kind: SnippetTokenKind = 'plain'): SnippetToken => ({ text, kind })

const snippetLine = (...tokens: SnippetToken[]) => tokens

const snippetTokenClass = (kind: SnippetTokenKind = 'plain') => {
  switch (kind) {
    case 'keyword':
      return 'text-sky-700 dark:text-sky-300'
    case 'string':
      return 'text-emerald-700 dark:text-emerald-300'
    case 'property':
      return 'text-violet-700 dark:text-violet-300'
    case 'function':
      return 'text-amber-700 dark:text-amber-300'
    case 'number':
      return 'text-rose-700 dark:text-rose-300'
    case 'comment':
      return 'text-zinc-400 dark:text-zinc-500'
    default:
      return 'text-zinc-900 dark:text-zinc-100'
  }
}

const messagingSnippet = [
  snippetLine(snippetToken('// background.ts', 'comment')),
  snippetLine(
    snippetToken('epos', 'property'),
    snippetToken('.'),
    snippetToken('bus', 'property'),
    snippetToken('.'),
    snippetToken('on', 'function'),
    snippetToken('('),
    snippetToken("'math:sum'", 'string'),
    snippetToken(', ('),
    snippetToken('a', 'plain'),
    snippetToken(', '),
    snippetToken('b', 'plain'),
    snippetToken(') => a + b)'),
  ),
  snippetLine(snippetToken(' ')),
  snippetLine(snippetToken('// content-script.ts', 'comment')),
  snippetLine(
    snippetToken('const', 'keyword'),
    snippetToken(' sum =', 'property'),
    snippetToken(' await', 'keyword'),
    snippetToken(' epos', 'property'),
    snippetToken('.'),
    snippetToken('bus', 'property'),
    snippetToken('.'),
    snippetToken('send', 'function'),
    snippetToken('('),
    snippetToken("'math:sum'", 'string'),
    snippetToken(', '),
    snippetToken('3', 'number'),
    snippetToken(', '),
    snippetToken('7', 'number'),
    snippetToken(')'),
  ),
]

const features = [
  {
    eyebrow: 'Messaging',
    title: 'Unified messaging',
    description: 'You use send/on everywhere. Epos handles the routing details for you.',
    note: 'You think about the message, not the route.',
    snippet: [
      snippetLine(
        snippetToken('send', 'function'),
        snippetToken('('),
        snippetToken("'session.start'", 'string'),
        snippetToken(', '),
        snippetToken('{ '),
        snippetToken('tabId', 'property'),
        snippetToken(' }'),
        snippetToken(')'),
      ),
      snippetLine(snippetToken('')),
      snippetLine(
        snippetToken('on', 'function'),
        snippetToken('('),
        snippetToken("'session.start'", 'string'),
        snippetToken(', '),
        snippetToken('('),
        snippetToken('{ '),
        snippetToken('tabId', 'property'),
        snippetToken(' }'),
        snippetToken(') => {', 'keyword'),
      ),
      snippetLine(
        snippetToken('  '),
        snippetToken('inspector', 'property'),
        snippetToken('.'),
        snippetToken('open', 'function'),
        snippetToken('('),
        snippetToken('tabId', 'property'),
        snippetToken(')'),
      ),
      snippetLine(snippetToken('}')),
    ],
    // href: '/guide/messaging',
    guide: 'See Messaging',
    class: 'md:col-span-2 xl:col-span-7 xl:row-span-2',
  },
  {
    eyebrow: 'State',
    title: 'Change it once. Watch it update everywhere.',
    description: 'State feels like a normal JavaScript object, but it stays in sync across contexts.',
    note: 'No manual sync layer.',
    snippet: [
      snippetLine(
        snippetToken('const', 'keyword'),
        snippetToken(' settings = '),
        snippetToken('state', 'function'),
        snippetToken('({ '),
        snippetToken('theme', 'property'),
        snippetToken(': '),
        snippetToken("'dark'", 'string'),
        snippetToken(' })'),
      ),
      snippetLine(snippetToken('')),
      snippetLine(
        snippetToken('settings', 'property'),
        snippetToken('.'),
        snippetToken('theme', 'property'),
        snippetToken(' = '),
        snippetToken("'light'", 'string'),
      ),
    ],
    // href: '/guide/state',
    guide: 'See State',
    class: 'xl:col-span-5',
  },
  {
    eyebrow: 'Persistence',
    title: 'It comes back after reloads.',
    description: 'User changes are restored automatically, without a second persistence system.',
    note: 'Reliable by default.',
    snippet: [
      snippetLine(
        snippetToken('const', 'keyword'),
        snippetToken(' prefs = '),
        snippetToken('state', 'function'),
        snippetToken('.'),
        snippetToken('persist', 'function'),
        snippetToken('('),
        snippetToken("'prefs'", 'string'),
        snippetToken(', { '),
        snippetToken('zoom', 'property'),
        snippetToken(': '),
        snippetToken('1', 'number'),
        snippetToken(' })'),
      ),
      snippetLine(snippetToken('')),
      snippetLine(
        snippetToken('prefs', 'property'),
        snippetToken('.'),
        snippetToken('zoom', 'property'),
        snippetToken(' += '),
        snippetToken('0.1', 'number'),
      ),
    ],
    // href: '/guide/state',
    guide: 'See State',
    class: 'xl:col-span-5',
  },
  {
    eyebrow: 'Storage',
    title: 'Save files in one place. Read them somewhere else.',
    description: 'Keep JSON, blobs, and files in one storage layer and use them across contexts.',
    note: 'Useful immediately, not after infrastructure work.',
    snippet: [
      snippetLine(
        snippetToken('await', 'keyword'),
        snippetToken(' '),
        snippetToken('storage', 'property'),
        snippetToken('.'),
        snippetToken('files', 'property'),
        snippetToken('.'),
        snippetToken('set', 'function'),
        snippetToken('('),
        snippetToken("'report.pdf'", 'string'),
        snippetToken(', file)'),
      ),
      snippetLine(snippetToken('')),
      snippetLine(
        snippetToken('const', 'keyword'),
        snippetToken(' report = '),
        snippetToken('await', 'keyword'),
        snippetToken(' '),
        snippetToken('storage', 'property'),
        snippetToken('.'),
        snippetToken('files', 'property'),
        snippetToken('.'),
        snippetToken('get', 'function'),
        snippetToken('('),
        snippetToken("'report.pdf'", 'string'),
        snippetToken(')'),
      ),
    ],
    // href: '/guide/storage',
    guide: 'See Storage',
    class: 'xl:col-span-4',
  },
  {
    eyebrow: 'Setup',
    title: 'You skip the setup phase almost entirely.',
    description: 'Install it, connect a folder, and start building. Most of the hard setup work is already done.',
    note: 'Zero-config is not a slogan here.',
    snippet: [
      snippetLine(snippetToken('{')),
      snippetLine(
        snippetToken('  '),
        snippetToken('"load"', 'property'),
        snippetToken(': ['),
        snippetToken('"src/background.ts"', 'string'),
        snippetToken(', '),
        snippetToken('"src/popup.tsx"', 'string'),
        snippetToken(']'),
      ),
      snippetLine(snippetToken('}')),
    ],
    // href: '/guide/basics',
    guide: 'See Basics',
    class: 'xl:col-span-3',
  },
  {
    eyebrow: 'Mental Model',
    title: 'You describe intent. Epos handles the weird parts.',
    description: 'You describe what should load where. Epos handles the browser-extension edge cases behind the scenes.',
    note: 'Less extension trivia in your head.',
    snippet: [
      snippetLine(snippetToken('{')),
      snippetLine(
        snippetToken('  '),
        snippetToken('matches', 'property'),
        snippetToken(': ['),
        snippetToken('"*://*/*"', 'string'),
        snippetToken('],'),
      ),
      snippetLine(
        snippetToken('  '),
        snippetToken('js', 'property'),
        snippetToken(': ['),
        snippetToken('"src/page.ts"', 'string'),
        snippetToken('],'),
      ),
      snippetLine(
        snippetToken('  '),
        snippetToken('css', 'property'),
        snippetToken(': ['),
        snippetToken('"src/page.css"', 'string'),
        snippetToken(']'),
      ),
      snippetLine(snippetToken('}')),
    ],
    href: '/guide/epos-json',
    guide: 'See epos.json',
    class: 'xl:col-span-5',
  },
]

const steps = [
  {
    number: '01',
    title: 'Install',
    description: 'Install Epos from the Chrome Web Store.',
  },
  {
    number: '02',
    title: 'Connect a folder',
    description: 'Link a local project folder.',
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
            Epos gives you a <span class="font-medium text-black dark:text-white">zero-config</span> workflow and
            <span class="font-medium text-black dark:text-white">powerful built-in features</span>
            that work across all execution contexts with no extra setup.
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
              href="/guide"
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
              class="grid first:*:pt-2 last:*:pb-2 sm:grid-cols-[78px_1fr]"
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
            WHY EPOS?
          </div>
          <h2 class="mt-4 text-3xl font-medium tracking-[-0.06em] sm:text-5xl">Reimagine extension development.</h2>
          <p class="mt-4 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg dark:text-zinc-300">
            Epos handles the boring parts and gives you powerful features out of the box. No setup, no heavy upfront work.
            Start building on day one.
          </p>
        </div>
      </div>

      <div
        :class="[
          'group mt-10 flex w-1/2 flex-col justify-between border border-zinc-800 bg-black/10 p-7 transition sm:p-8',
        ]"
      >
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-2xl font-medium text-black sm:text-3xl dark:text-white">Unified messaging.</h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-git-pull-request-arrow-icon lucide-git-pull-request-arrow size-10"
          >
            <circle cx="5" cy="6" r="3" />
            <path d="M5 9v12" />
            <circle cx="19" cy="18" r="3" />
            <path d="m15 9-3-3 3-3" />
            <path d="M12 6h5a2 2 0 0 1 2 2v7" />
          </svg>
        </div>
        <p class="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-[15px] dark:text-zinc-300">
          Just send and receive messages. Epos handles the routing automatically.
        </p>
        <pre
          class="mt-6 overflow-x-auto border border-zinc-200 bg-zinc-50 px-4 py-4 text-[12px] leading-6 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        ><code><span v-for="(line, lineIndex) in messagingSnippet" :key="`${lineIndex}`" class="block whitespace-pre"><span
  v-for="(token, tokenIndex) in line"
  :key="`${lineIndex}-${tokenIndex}`"
  :class="snippetTokenClass(token.kind)"
>{{ token.text }}</span></span></code></pre>
      </div>

      <div
        :class="[
          'mt-10 grid gap-px border border-zinc-200 bg-zinc-200 md:grid-cols-2 xl:grid-cols-12',
          'dark:border-zinc-800 dark:bg-zinc-800',
        ]"
      >
        <a
          v-for="feature in features"
          :key="feature.title"
          :href="feature.href"
          :class="[
            'group flex min-h-72 flex-col justify-between bg-white p-7 transition hover:bg-zinc-50 sm:p-8 dark:bg-black dark:hover:bg-zinc-950',
            feature.class,
          ]"
        >
          <div>
            <div class="font-mono text-[11px] tracking-[0.28em] text-zinc-500 uppercase dark:text-zinc-400">
              {{ feature.eyebrow }}
            </div>
            <h3 class="mt-5 max-w-3xl text-2xl font-medium tracking-[-0.06em] text-black sm:text-3xl dark:text-white">
              {{ feature.title }}
            </h3>
            <p class="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-[15px] dark:text-zinc-300">
              {{ feature.description }}
            </p>

            <pre
              class="mt-6 overflow-x-auto border border-zinc-200 bg-zinc-50 px-4 py-4 text-[12px] leading-6 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            ><code>
<span v-for="(line, lineIndex) in feature.snippet" :key="`${feature.title}-${lineIndex}`" class="block whitespace-pre"><span
  v-for="(token, tokenIndex) in line"
  :key="`${feature.title}-${lineIndex}-${tokenIndex}`"
  :class="snippetTokenClass(token.kind)"
>{{ token.text }}</span></span></code></pre>
          </div>
          <div class="mt-8 flex items-end justify-between gap-6 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <div class="max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">{{ feature.note }}</div>
            <div :class="['shrink-0 font-mono text-[11px] tracking-[0.24em] text-black uppercase', 'dark:text-white']">
              {{ feature.guide }} →
            </div>
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
