---
layout: page
pageClass: landing-page
sidebar: false
aside: false
footer: false
---

<div class="relative overflow-hidden border-x border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
  <div class="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.06)_1px,transparent_1px)] bg-size-[28px_28px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"></div>
  <div class="absolute inset-x-0 top-0 -z-10 h-64 bg-linear-to-b from-lime-300/20 via-cyan-300/10 to-transparent dark:from-lime-300/10 dark:via-cyan-300/10"></div>
  <section class="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.8fr)] lg:px-12 lg:py-20">
    <div class="flex flex-col gap-8">
      <div class="max-w-4xl space-y-6">
        <h1 class="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-balance sm:text-6xl lg:text-7xl">
          Build browser extensions without wiring every context by hand.
        </h1>
        <p class="max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-300">
          Epos gives you one way to work across popup, background, pages, frames, and injected UI. It keeps setup small and moves the repetitive parts out of your app code.
        </p>
      </div>
      <div class="flex flex-wrap gap-4">
        <a href="/guide/" class="inline-flex items-center border border-zinc-950 bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-lime-300 hover:text-zinc-950 dark:border-lime-300 dark:bg-lime-300 dark:text-zinc-950 dark:hover:bg-white">
          Read the guide
        </a>
        <a href="https://get.epos.dev" class="inline-flex items-center border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-white dark:hover:text-white">
          Install Epos
        </a>
      </div>
      <div class="grid gap-px border border-zinc-200 bg-zinc-200 text-sm sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-800">
        <div class="bg-white p-4 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Setup</div>
          <div class="mt-2 text-zinc-700 dark:text-zinc-200">Small config, local folder, direct browser workflow.</div>
        </div>
        <div class="bg-white p-4 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Sync</div>
          <div class="mt-2 text-zinc-700 dark:text-zinc-200">Shared state across popup, background, tabs, and frames.</div>
        </div>
        <div class="bg-white p-4 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">UI</div>
          <div class="mt-2 text-zinc-700 dark:text-zinc-200">Render into pages with isolated styles when you need them.</div>
        </div>
      </div>
    </div>
    <div class="border border-zinc-200 bg-zinc-50 p-4 shadow-[12px_12px_0_0_rgba(24,24,27,0.08)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[12px_12px_0_0_rgba(255,255,255,0.04)]">
      <div class="flex items-center justify-between border border-zinc-200 bg-white px-4 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        <span>epos.json</span>
        <span>runtime map</span>
      </div>
      <pre v-pre class="mt-4 overflow-x-auto border border-zinc-200 bg-zinc-950 p-5 text-sm leading-7 text-zinc-100 dark:border-zinc-800">{
    "name": "My Extension",
    "targets": [
      {
        "matches": "popup",
        "load": ["popup.css", "popup.js"]
      },
      {
        "matches": "*://*.example.com/*",
        "load": ["shadow:main.css", "main.js"]
      }
    ]
  }
}</pre>
<div class="mt-4 grid gap-px border border-zinc-200 bg-zinc-200 text-sm dark:border-zinc-800 dark:bg-zinc-800">
<div class="bg-white px-4 py-3 dark:bg-zinc-950">
<span class="font-mono text-xs uppercase tracking-[0.22em] text-lime-700 dark:text-lime-300">01</span>
<span class="ml-3 text-zinc-700 dark:text-zinc-200">Define what runs where.</span>
</div>
<div class="bg-white px-4 py-3 dark:bg-zinc-950">
<span class="font-mono text-xs uppercase tracking-[0.22em] text-lime-700 dark:text-lime-300">02</span>
<span class="ml-3 text-zinc-700 dark:text-zinc-200">Share state and messages between contexts.</span>
</div>
<div class="bg-white px-4 py-3 dark:bg-zinc-950">
<span class="font-mono text-xs uppercase tracking-[0.22em] text-lime-700 dark:text-lime-300">03</span>
<span class="ml-3 text-zinc-700 dark:text-zinc-200">Keep UI isolated with Shadow DOM when the page is hostile.</span>
</div>
</div>
</div>
  </section>
  <section class="border-t border-zinc-200 dark:border-zinc-800">
    <div class="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Core parts</p>
          <h2 class="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">The pieces you usually end up rebuilding.</h2>
        </div>
        <p class="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          Most extension projects need the same plumbing: state that moves across contexts, a message layer, storage, and page rendering that does not break on random sites. Epos groups those parts into one system.
        </p>
      </div>
      <div class="grid gap-px border border-zinc-200 bg-zinc-200 md:grid-cols-2 xl:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-800">
        <article class="bg-white p-6 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">State</div>
          <h3 class="mt-4 text-xl font-medium">Keep one source of truth.</h3>
          <p class="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">Read and update data from popup, background, side panel, web pages, and frames without writing separate sync code for each pair.</p>
        </article>
        <article class="bg-white p-6 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">Messaging</div>
          <h3 class="mt-4 text-xl font-medium">Talk between contexts directly.</h3>
          <p class="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">Send messages across the extension with fewer moving parts, instead of hand-rolling routes for every runtime boundary.</p>
        </article>
        <article class="bg-white p-6 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">Rendering</div>
          <h3 class="mt-4 text-xl font-medium">Mount UI where it needs to live.</h3>
          <p class="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">Inject files into the right targets and render inside a Shadow DOM root when you need isolation from the host page.</p>
        </article>
        <article class="bg-white p-6 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">Storage</div>
          <h3 class="mt-4 text-xl font-medium">Persist files and app data.</h3>
          <p class="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">Store app state, blobs, and other file data with one storage layer that fits extension use cases.</p>
        </article>
      </div>
    </div>
  </section>
  <section class="border-t border-zinc-200 dark:border-zinc-800">
    <div class="mx-auto grid max-w-7xl gap-px px-6 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-16">
      <div class="border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p class="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Why it helps</p>
        <h2 class="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Less time on extension glue code.</h2>
        <p class="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          The hard part of browser extensions is often not the feature itself. It is the runtime split. Epos gives you a structure for that split so you can stay closer to product code.
        </p>
      </div>
      <div class="grid gap-px border border-zinc-200 bg-zinc-200 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-800">
        <div class="bg-white p-6 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Context map</div>
          <p class="mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-200">Popup, background, content scripts, extension pages, frames, and page UI each have different limits. Epos keeps those boundaries explicit.</p>
        </div>
        <div class="bg-white p-6 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Browser APIs</div>
          <p class="mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-200">Use supported Chrome APIs in more places, including web pages and iframes, without scattering fallback code all over the project.</p>
        </div>
        <div class="bg-white p-6 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Injection</div>
          <p class="mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-200">Load the right files into the right targets. This matters when the same extension needs UI, background logic, and page integration at once.</p>
        </div>
        <div class="bg-white p-6 dark:bg-zinc-950">
          <div class="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Storage</div>
          <p class="mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-200">Keep persistent app data and files together, instead of mixing several browser storage APIs and custom serialization rules.</p>
        </div>
      </div>
    </div>
  </section>
  <section class="border-t border-zinc-200 dark:border-zinc-800">
    <div class="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-16">
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Start here</p>
        <h2 class="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Read the guide, then wire a real extension.</h2>
      </div>
      <div class="flex flex-wrap gap-4">
        <a href="/guide/" class="inline-flex items-center border border-zinc-950 bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-300 hover:text-zinc-950 dark:border-cyan-300 dark:bg-cyan-300 dark:text-zinc-950 dark:hover:bg-white">
          Open docs
        </a>
        <a href="/api/" class="inline-flex items-center border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-white dark:hover:text-white">
          Browse API
        </a>
      </div>
    </div>
  </section>
</div>
