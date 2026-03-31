<script setup lang="ts">
type CodeToken = {
  text: string
  className?: string
}

const token = (text: string, className?: string): CodeToken => ({ text, className })
const line = (...tokens: CodeToken[]) => tokens

const steps = [
  { index: '01', title: 'Install', description: 'Install Epos from the Chrome Web Store.' },
  { index: '02', title: 'Connect', description: 'Connect a local project folder.' },
  { index: '03', title: 'Develop', description: 'Epos runs your code in the browser.' },
  { index: '04', title: 'Export', description: 'Click Export to get a ZIP bundle.' },
]

const messagingCode = [
  line(token('// popup.tsx', 'code-comment')),
  line(
    token('await', 'code-keyword'),
    token(' '),
    token('epos', 'code-variable'),
    token('.', 'code-punctuation'),
    token('bus', 'code-property'),
    token('.', 'code-punctuation'),
    token('send', 'code-function'),
    token('(', 'code-punctuation'),
    token("'analytics:event'", 'code-string'),
    token(', ', 'code-punctuation'),
    token("'save'", 'code-string'),
    token(')', 'code-punctuation'),
  ),
  line(),
  line(token('// background.ts', 'code-comment')),
  line(
    token('epos', 'code-variable'),
    token('.', 'code-punctuation'),
    token('bus', 'code-property'),
    token('.', 'code-punctuation'),
    token('on', 'code-function'),
    token('(', 'code-punctuation'),
    token("'analytics:event'", 'code-string'),
    token(', ', 'code-punctuation'),
    token('eventName', 'code-variable'),
    token(' ', 'code-punctuation'),
    token('=>', 'code-operator'),
    token(' ', 'code-punctuation'),
    token('{', 'code-punctuation'),
  ),
  line(
    token('', 'code-indent'),
    token('console', 'code-variable'),
    token('.', 'code-punctuation'),
    token('log', 'code-function'),
    token('(', 'code-punctuation'),
    token('eventName', 'code-variable'),
    token(')', 'code-punctuation'),
  ),
  line(token('}', 'code-punctuation')),
]

const stateCode = [
  line(token('// shared.ts', 'code-comment')),
  line(
    token('const', 'code-keyword'),
    token(' '),
    token('state', 'code-variable'),
    token(' = ', 'code-operator'),
    token('await', 'code-keyword'),
    token(' '),
    token('epos', 'code-variable'),
    token('.', 'code-punctuation'),
    token('state', 'code-property'),
    token('.', 'code-punctuation'),
    token('connect', 'code-function'),
    token('(', 'code-punctuation'),
    token('{ ', 'code-punctuation'),
    token('user', 'code-property'),
    token(': ', 'code-operator'),
    token('null', 'code-boolean'),
    token(', ', 'code-punctuation'),
    token('items', 'code-property'),
    token(': ', 'code-operator'),
    token('[]', 'code-punctuation'),
    token(' }', 'code-punctuation'),
    token(')', 'code-punctuation'),
  ),
  line(),
  line(token('// anywhere', 'code-comment')),
  line(
    token('state', 'code-variable'),
    token('.', 'code-punctuation'),
    token('user', 'code-property'),
    token(' = ', 'code-operator'),
    token('{ ', 'code-punctuation'),
    token('name', 'code-property'),
    token(': ', 'code-operator'),
    token("'Alex'", 'code-string'),
    token(' }', 'code-punctuation'),
  ),
  line(
    token('state', 'code-variable'),
    token('.', 'code-punctuation'),
    token('items', 'code-property'),
    token('.', 'code-punctuation'),
    token('push', 'code-function'),
    token('(', 'code-punctuation'),
    token('{ ', 'code-punctuation'),
    token('id', 'code-property'),
    token(': ', 'code-operator'),
    token('1', 'code-number'),
    token(', ', 'code-punctuation'),
    token('name', 'code-property'),
    token(': ', 'code-operator'),
    token("'Item 1'", 'code-string'),
    token(' }', 'code-punctuation'),
    token(')', 'code-punctuation'),
  ),
]

const storageCode = [
  line(token('// save', 'code-comment')),
  line(
    token('await', 'code-keyword'),
    token(' '),
    token('epos', 'code-variable'),
    token('.', 'code-punctuation'),
    token('storage', 'code-property'),
    token('.', 'code-punctuation'),
    token('set', 'code-function'),
    token('(', 'code-punctuation'),
    token("'profile-pic'", 'code-string'),
    token(', ', 'code-punctuation'),
    token('imageBlob', 'code-variable'),
    token(')', 'code-punctuation'),
  ),
  line(),
  line(token('// load', 'code-comment')),
  line(
    token('const', 'code-keyword'),
    token(' '),
    token('imageBlob', 'code-variable'),
    token(' = ', 'code-operator'),
    token('await', 'code-keyword'),
    token(' '),
    token('epos', 'code-variable'),
    token('.', 'code-punctuation'),
    token('storage', 'code-property'),
    token('.', 'code-punctuation'),
    token('get', 'code-function'),
    token('(', 'code-punctuation'),
    token("'profile-pic'", 'code-string'),
    token(')', 'code-punctuation'),
  ),
]

const browserCode = [
  line(token('// page.ts', 'code-comment')),
  line(
    token('const', 'code-keyword'),
    token(' '),
    token('tabs', 'code-variable'),
    token(' = ', 'code-operator'),
    token('await', 'code-keyword'),
    token(' '),
    token('epos', 'code-variable'),
    token('.', 'code-punctuation'),
    token('browser', 'code-property'),
    token('.', 'code-punctuation'),
    token('tabs', 'code-property'),
    token('.', 'code-punctuation'),
    token('query', 'code-function'),
    token('({ ', 'code-punctuation'),
    token('active', 'code-property'),
    token(': ', 'code-operator'),
    token('true', 'code-boolean'),
    token(' })', 'code-punctuation'),
  ),
  line(),
  line(
    token('console', 'code-variable'),
    token('.', 'code-punctuation'),
    token('log', 'code-function'),
    token('(', 'code-punctuation'),
    token('tabs', 'code-variable'),
    token(')', 'code-punctuation'),
  ),
]

const setupCode = [
  line(token('// epos.json', 'code-comment')),
  line(token('{', 'code-punctuation')),
  line(
    token('', 'code-indent'),
    token('"name"', 'code-string'),
    token(': ', 'code-operator'),
    token('"My Extension"', 'code-string'),
    token(',', 'code-punctuation'),
  ),
  line(
    token('', 'code-indent'),
    token('"targets"', 'code-string'),
    token(': ', 'code-operator'),
    token('[', 'code-punctuation'),
  ),
  line(
    token('', 'code-indent'),
    token('', 'code-indent'),
    token('{ ', 'code-punctuation'),
    token('"matches"', 'code-string'),
    token(': ', 'code-operator'),
    token('"<popup>"', 'code-string'),
    token(', ', 'code-punctuation'),
    token('"load"', 'code-string'),
    token(': [', 'code-operator'),
    token('"dist/popup.js"', 'code-string'),
    token('] }', 'code-punctuation'),
    token(',', 'code-punctuation'),
  ),
  line(
    token('', 'code-indent'),
    token('', 'code-indent'),
    token('{ ', 'code-punctuation'),
    token('"matches"', 'code-string'),
    token(': ', 'code-operator'),
    token('"<background>"', 'code-string'),
    token(', ', 'code-punctuation'),
    token('"load"', 'code-string'),
    token(': [', 'code-operator'),
    token('"dist/background.js"', 'code-string'),
    token('] }', 'code-punctuation'),
    token(',', 'code-punctuation'),
  ),
  line(
    token('', 'code-indent'),
    token('', 'code-indent'),
    token('{ ', 'code-punctuation'),
    token('"matches"', 'code-string'),
    token(': ', 'code-operator'),
    token('"*://*.example.com/*"', 'code-string'),
    token(', ', 'code-punctuation'),
    token('"load"', 'code-string'),
    token(': [', 'code-operator'),
    token('"dist/page.js"', 'code-string'),
    token('] }', 'code-punctuation'),
  ),
  line(token('', 'code-indent'), token(']', 'code-punctuation')),
  line(token('}', 'code-punctuation')),
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
.feature-list {
  @apply mt-5 space-y-3 text-base leading-8 text-dim;
}
.feature-item {
  @apply flex gap-4;
}
.feature-dot {
  @apply shrink-0 text-xl leading-8 text-zinc-400 dark:text-zinc-500;
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

    <div class="border-t border-r border-l border-divider p-7 sm:p-8 md:p-12">
      <div class="eyebrow">WHY EPOS?</div>
      <h2 class="h2 mt-4">Reimagine extension development.</h2>
      <p class="prose mt-4 max-w-3xl">
        Epos is a browser extension for building other browser extensions. Connect a local folder, describe what should
        load, and start with the hard parts already handled for you.
      </p>
    </div>

    <div class="grid xl:grid-cols-2">
      <div class="box border-t border-r border-l xl:border-r-0">
        <div class="eyebrow">MESSAGING</div>
        <h2 class="h2 mt-4">One messaging layer across the whole extension.</h2>
        <p class="prose mt-4 max-w-2xl">
          <code>epos.bus</code> gives you one API across popup, background, side panel, web pages, and iframes.
        </p>
        <ul class="feature-list">
          <li class="feature-item">
            <span class="feature-dot">•</span><span>No switching between multiple browser messaging APIs.</span>
          </li>
          <li class="feature-item">
            <span class="feature-dot">•</span><span>Epos handles routing based on where the listener actually lives.</span>
          </li>
          <li class="feature-item">
            <span class="feature-dot">•</span
            ><span>The same mental model works for events and request-response flows.</span>
          </li>
        </ul>
        <div class="code-block">
          <div class="code">
            <div v-for="(line, index) in messagingCode" :key="`messaging-${index}`" class="code-line">
              <template v-if="line.length">
                <div
                  v-for="(part, partIndex) in line"
                  :key="`messaging-${index}-${partIndex}`"
                  :class="part.className || ''"
                >
                  {{ part.text }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="box border-t border-r border-l xl:border-l-0">
        <div class="eyebrow">SHARED STATE</div>
        <h2 class="h2 mt-4">State that behaves like a normal object.</h2>
        <p class="prose mt-4 max-w-2xl">
          <code>epos.state</code> gives you one shared object that is both synchronized and persisted across contexts.
        </p>
        <ul class="feature-list">
          <li class="feature-item">
            <span class="feature-dot">•</span><span>Read and write values directly with normal objects and arrays.</span>
          </li>
          <li class="feature-item">
            <span class="feature-dot">•</span
            ><span>Updates in one context appear in another without a custom sync layer.</span>
          </li>
          <li class="feature-item">
            <span class="feature-dot">•</span
            ><span>State comes back on the next startup without separate persistence code.</span>
          </li>
        </ul>
        <div class="code-block">
          <div class="code">
            <div v-for="(line, index) in stateCode" :key="`state-${index}`" class="code-line">
              <template v-if="line.length">
                <div v-for="(part, partIndex) in line" :key="`state-${index}-${partIndex}`" :class="part.className || ''">
                  {{ part.text }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid xl:grid-cols-2">
      <div class="box border-t border-r border-l xl:border-r-0">
        <div class="eyebrow">STORAGE</div>
        <h2 class="h2 mt-4">Persistent storage for files and heavy data.</h2>
        <p class="prose mt-4 max-w-2xl">
          <code>epos.storage</code> is a clean place for blobs, files, and other data that should persist without being
          reactive.
        </p>
        <ul class="feature-list">
          <li class="feature-item">
            <span class="feature-dot">•</span><span>Save in one context and read in another through the same API.</span>
          </li>
          <li class="feature-item">
            <span class="feature-dot">•</span
            ><span>Backed by IndexedDB, so it handles more than simple key-value strings.</span>
          </li>
          <li class="feature-item">
            <span class="feature-dot">•</span><span>A natural complement to state when payloads get heavier.</span>
          </li>
        </ul>
        <div class="code-block">
          <div class="code">
            <div v-for="(line, index) in storageCode" :key="`storage-${index}`" class="code-line">
              <template v-if="line.length">
                <div v-for="(part, partIndex) in line" :key="`storage-${index}-${partIndex}`" :class="part.className || ''">
                  {{ part.text }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="box border-t border-r border-l xl:border-l-0">
        <div class="eyebrow">BROWSER API</div>
        <h2 class="h2 mt-4">Supported extension APIs in more places.</h2>
        <p class="prose mt-4 max-w-2xl">
          <code>epos.browser</code> mirrors supported <code>chrome.*</code> APIs and brings them into contexts where those
          APIs normally disappear.
        </p>
        <ul class="feature-list">
          <li class="feature-item">
            <span class="feature-dot">•</span><span>Especially useful on web pages and in iframes.</span>
          </li>
          <li class="feature-item">
            <span class="feature-dot">•</span><span>Keeps extension logic from splitting into special-case branches.</span>
          </li>
          <li class="feature-item">
            <span class="feature-dot">•</span><span>Makes page-level code a first-class part of the extension.</span>
          </li>
        </ul>
        <div class="code-block">
          <div class="code">
            <div v-for="(line, index) in browserCode" :key="`browser-${index}`" class="code-line">
              <template v-if="line.length">
                <div v-for="(part, partIndex) in line" :key="`browser-${index}-${partIndex}`" :class="part.className || ''">
                  {{ part.text }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="border border-divider p-7 sm:p-8 md:p-12">
      <div class="eyebrow">SETUP</div>
      <h2 class="h2 mt-4">Describe what should load. Epos handles the rest.</h2>
      <p class="prose mt-4 max-w-3xl">
        Instead of wiring manifest details by hand, you describe targets in <code>epos.json</code> and let Epos handle
        injection, isolation, and export-ready output.
      </p>
      <ul class="feature-list max-w-3xl">
        <li class="feature-item">
          <span class="feature-dot">•</span
          ><span>Use one config file to describe popup, background, pages, and other targets.</span>
        </li>
        <li class="feature-item">
          <span class="feature-dot">•</span><span>Skip repetitive manifest plumbing during development.</span>
        </li>
        <li class="feature-item">
          <span class="feature-dot">•</span><span>Keep the setup mental model small even as the extension grows.</span>
        </li>
      </ul>
      <div class="code-block max-w-4xl">
        <div class="code">
          <div v-for="(line, index) in setupCode" :key="`setup-${index}`" class="code-line">
            <template v-if="line.length">
              <div v-for="(part, partIndex) in line" :key="`setup-${index}-${partIndex}`" :class="part.className || ''">
                {{ part.text }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
