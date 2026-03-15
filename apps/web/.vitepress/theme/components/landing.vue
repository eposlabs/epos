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
  @apply grow border-zinc-200 p-12;
}
.eyebrow {
  @apply font-mono text-[11px] tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-400;
}
.prose {
  @apply text-lg leading-8 text-zinc-500;
  @apply *:[strong]:font-medium *:[strong]:text-black;
}
.h1 {
  @apply text-8xl font-medium tracking-tighter text-black dark:text-white;
}
.h2 {
  @apply text-3xl tracking-normal text-black;
}
.h3 {
  @apply text-xl text-black;
}
.button {
  @apply border px-9 py-3 text-sm font-medium text-black transition hover:bg-zinc-100;
}
code {
  @apply rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-800;
}
</style>

<template>
  <div class="mx-auto max-w-7xl">
    <!-- Hero -->
    <div class="flex">
      <div class="box w-[60%] border-l">
        <div class="eyebrow">WEB EXTENSION ENGINE</div>
        <h1 class="h1 mt-6">A better way to build browser extensions</h1>
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
      <div class="box border-r">
        <div class="eyebrow">WORKFLOW</div>
        <div class="mt-8">
          <div class="flex" v-for="(step, index) in steps" :key="step.index">
            <div class="flex flex-col items-center">
              <div class="font-mono text-xl text-zinc-500">{{ step.index }}</div>
              <div class="my-2.5 h-15 w-px bg-zinc-300" v-if="index < steps.length - 1"></div>
            </div>
            <div class="ml-7">
              <h3 class="h3">{{ step.title }}</h3>
              <div class="mt-2 text-sm text-zinc-500">{{ step.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Why Epos -->
    <div class="box space-y-4 border-t border-r border-l">
      <div class="eyebrow">WHY EPOS?</div>
      <h2 class="h2">Reimagine extension development</h2>
      <p class="prose max-w-2xl">
        Epos is a browser extension for building other browser extensions. Connect a local folder, describe what should
        load, and start with the hard parts already handled for you.
      </p>
    </div>

    <div class="flex">
      <!-- Messaging -->
      <div class="box border-t border-l">
        <div class="eyebrow">MESSAGING</div>
        <h2 class="h2 mt-4">Unified messaging system</h2>
        <p class="prose mt-4 max-w-2xl">
          Just use <code>epos.bus.send</code> and <code>epos.bus.on</code> for cross-context communication. Epos
          automatically handles the routing. Works in all contexts, including web pages and iframes.
        </p>
        <ul class="prose mt-4 list-disc space-y-3 pl-5 text-zinc-500">
          <li>Automatic routing</li>
          <li>Works in all contexts</li>
        </ul>
        <div class="mt-4 rounded-xl bg-black px-5 py-5 text-white">
          <pre>
// Send
epos.bus.send('event', data)

// Listen
epos.bus.on('event', handler)</pre
          >
        </div>
      </div>

      <!-- State -->
      <div class="box border-t border-r border-l">
        <div class="eyebrow">SHARED STATE</div>
        <h2 class="h2 mt-4">State that feels like normal object</h2>
        <p class="prose mt-4 max-w-2xl">
          Connect once and work with one shared object across contexts. Read and write state directly with normal objects
          and arrays. Changes sync automatically, so updates in background appear in popup right away. State is persisted
          and restored when the browser opens again.
        </p>
        <div class="mt-4 rounded-xl bg-black px-5 py-5 text-white">
          <pre>
// Connect
const state = epos.state.connect()

// Modify
state.user = { name: 'Alex' }
state.items = []
state.items.push({ id: 1, name: 'Item 1' })</pre
          >
        </div>
      </div>
    </div>

    <!-- Storage -->
    <div class="box flex border-t border-r border-l">
      <div>
        <div class="eyebrow">STORAGE</div>
        <h2 class="h2 mt-4">Simple key-value storage</h2>
        <p class="prose mt-4 max-w-2xl">
          Use <code>epos.storage</code> for files, blobs, and heavier persistent data. Save data in one context and read it
          back in another. Backed by IndexedDB, so it handles more than simple key-value strings. A good fit for data that
          should persist but does not need reactive updates.
        </p>
      </div>
      <div class="ml-10 rounded-xl bg-black px-5 py-5 text-white">
        <pre>
// Store
await epos.storage.set('profile-pic', imageBlob)

// Load
const imageBlob = await epos.storage.get('profile-pic')</pre
        >
      </div>
    </div>

    <!-- Extension API -->
    <div class="box border-t border-r border-l">
      <div class="eyebrow">EXTENSION API</div>
      <h2 class="h2 mt-4">Extension API everywhere</h2>
      <p class="prose mt-4 max-w-2xl">
        <code>epos.browser.*</code> mirrors supported <code>chrome.*</code> APIs and makes them available in all contexts.
        This is especially useful on web pages and in iframes, where the standard extension APIs are not available.
      </p>
      <div class="mt-4 rounded-xl bg-black px-5 py-5 text-white">
        <pre>
// content-script.ts
const tabs = await epos.browser.tabs.query({ active: true })
console.log(tabs)</pre
        >
      </div>
    </div>

    <!-- Simplified Setup -->
    <div class="box border-t border-r border-l">
      <div class="eyebrow">SETUP</div>
      <h2 class="h2 mt-4">Simplified setup for your extensions</h2>
      <p class="prose mt-4 max-w-2xl">
        Just tell Epos what fliles to load and where and Epos already knows how to inject scripts, isolate styles, and
        handle all hard setup for your application to work cross-context.
      </p>
      <div class="mt-4 rounded-xl bg-black px-5 py-5 text-white">
        <pre>
// epos.json
{
  "name": "My Extension",
  "targets": [
    {
      "match": ["*://*.example.com/*"],
      "scripts": ["main.css", "main.js"]
    },
    {
      "match": ["&lt;popup&gt;"],
      "scripts": ["popup.css", "popup.js"]
    },
    {
      "match": ["&lt;background&gt;"],
      "scripts": ["background.js"]
    }
  ],
}</pre
        >
      </div>
    </div>
  </div>
</template>
