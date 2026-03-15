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
  @apply text-zinc-400 dark:text-zinc-500;
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
  @apply text-zinc-500 dark:text-zinc-400;
}
code {
  @apply rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-800;
}
</style>

<template>
  <div class="mx-auto max-w-7xl">
    <slot name="title" />
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
        <div class="code-block">
          <div class="code">
            <div class="code-line">
              <div class="code-comment">// Send</div>
            </div>
            <div class="code-line">
              <div class="code-variable">epos</div><div class="code-punctuation">.</div><div class="code-property">bus</div><div class="code-punctuation">.</div><div class="code-function">send</div><div class="code-punctuation">(</div><div class="code-string">'event'</div><div class="code-punctuation">,</div> <div class="code-variable">data</div><div class="code-punctuation">)</div>
            </div>
            <div class="code-line"></div>
            <div class="code-line">
              <div class="code-comment">// Listen</div>
            </div>
            <div class="code-line">
              <div class="code-variable">epos</div><div class="code-punctuation">.</div><div class="code-property">bus</div><div class="code-punctuation">.</div><div class="code-function">on</div><div class="code-punctuation">(</div><div class="code-string">'event'</div><div class="code-punctuation">,</div> <div class="code-variable">handler</div><div class="code-punctuation">)</div>
            </div>
          </div>
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
        <div class="code-block">
          <div class="code">
            <div class="code-line">
              <div class="code-comment">// Connect</div>
            </div>
            <div class="code-line">
              <div class="code-keyword">const</div> <div class="code-variable">state</div> <div class="code-operator">=</div> <div class="code-variable">epos</div><div class="code-punctuation">.</div><div class="code-property">state</div><div class="code-punctuation">.</div><div class="code-function">connect</div><div class="code-punctuation">()</div>
            </div>
            <div class="code-line"></div>
            <div class="code-line">
              <div class="code-comment">// Modify</div>
            </div>
            <div class="code-line">
              <div class="code-variable">state</div><div class="code-punctuation">.</div><div class="code-property">user</div> <div class="code-operator">=</div> <div class="code-punctuation">{</div> <div class="code-property">name</div><div class="code-operator">:</div> <div class="code-string">'Alex'</div> <div class="code-punctuation">}</div>
            </div>
            <div class="code-line">
              <div class="code-variable">state</div><div class="code-punctuation">.</div><div class="code-property">items</div> <div class="code-operator">=</div> <div class="code-punctuation">[]</div>
            </div>
            <div class="code-line">
              <div class="code-variable">state</div><div class="code-punctuation">.</div><div class="code-property">items</div><div class="code-punctuation">.</div><div class="code-function">push</div><div class="code-punctuation">(</div><div class="code-punctuation">{</div> <div class="code-property">id</div><div class="code-operator">:</div> <div class="code-number">1</div><div class="code-punctuation">,</div> <div class="code-property">name</div><div class="code-operator">:</div> <div class="code-string">'Item 1'</div> <div class="code-punctuation">}</div><div class="code-punctuation">)</div>
            </div>
          </div>
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
      <div class="code-block ml-10">
        <div class="code">
          <div class="code-line">
            <div class="code-comment">// Store</div>
          </div>
          <div class="code-line">
            <div class="code-keyword">await</div> <div class="code-variable">epos</div><div class="code-punctuation">.</div><div class="code-property">storage</div><div class="code-punctuation">.</div><div class="code-function">set</div><div class="code-punctuation">(</div><div class="code-string">'profile-pic'</div><div class="code-punctuation">,</div> <div class="code-variable">imageBlob</div><div class="code-punctuation">)</div>
          </div>
          <div class="code-line"></div>
          <div class="code-line">
            <div class="code-comment">// Load</div>
          </div>
          <div class="code-line">
            <div class="code-keyword">const</div> <div class="code-variable">imageBlob</div> <div class="code-operator">=</div> <div class="code-keyword">await</div> <div class="code-variable">epos</div><div class="code-punctuation">.</div><div class="code-property">storage</div><div class="code-punctuation">.</div><div class="code-function">get</div><div class="code-punctuation">(</div><div class="code-string">'profile-pic'</div><div class="code-punctuation">)</div>
          </div>
        </div>
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
      <div class="code-block">
        <div class="code">
          <div class="code-line">
            <div class="code-comment">// content-script.ts</div>
          </div>
          <div class="code-line">
            <div class="code-keyword">const</div> <div class="code-variable">tabs</div> <div class="code-operator">=</div> <div class="code-keyword">await</div> <div class="code-variable">epos</div><div class="code-punctuation">.</div><div class="code-property">browser</div><div class="code-punctuation">.</div><div class="code-property">tabs</div><div class="code-punctuation">.</div><div class="code-function">query</div><div class="code-punctuation">(</div><div class="code-punctuation">{</div> <div class="code-property">active</div><div class="code-operator">:</div> <div class="code-boolean">true</div> <div class="code-punctuation">}</div><div class="code-punctuation">)</div>
          </div>
          <div class="code-line">
            <div class="code-variable">console</div><div class="code-punctuation">.</div><div class="code-function">log</div><div class="code-punctuation">(</div><div class="code-variable">tabs</div><div class="code-punctuation">)</div>
          </div>
        </div>
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
      <div class="code-block">
        <div class="code">
          <div class="code-line">
            <div class="code-comment">// epos.json</div>
          </div>
          <div class="code-line">
            <div class="code-punctuation">{</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-string">"name"</div><div class="code-operator">:</div> <div class="code-string">"My Extension"</div><div class="code-punctuation">,</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-string">"targets"</div><div class="code-operator">:</div> <div class="code-punctuation">[</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-punctuation">{</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-indent"></div><div class="code-string">"match"</div><div class="code-operator">:</div> <div class="code-punctuation">[</div><div class="code-string">"*://*.example.com/*"</div><div class="code-punctuation">],</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-indent"></div><div class="code-string">"scripts"</div><div class="code-operator">:</div> <div class="code-punctuation">[</div><div class="code-string">"main.css"</div><div class="code-punctuation">,</div> <div class="code-string">"main.js"</div><div class="code-punctuation">]</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-punctuation">},</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-punctuation">{</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-indent"></div><div class="code-string">"match"</div><div class="code-operator">:</div> <div class="code-punctuation">[</div><div class="code-string">"&lt;popup&gt;"</div><div class="code-punctuation">],</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-indent"></div><div class="code-string">"scripts"</div><div class="code-operator">:</div> <div class="code-punctuation">[</div><div class="code-string">"popup.css"</div><div class="code-punctuation">,</div> <div class="code-string">"popup.js"</div><div class="code-punctuation">]</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-punctuation">},</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-punctuation">{</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-indent"></div><div class="code-string">"match"</div><div class="code-operator">:</div> <div class="code-punctuation">[</div><div class="code-string">"&lt;background&gt;"</div><div class="code-punctuation">],</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-indent"></div><div class="code-string">"scripts"</div><div class="code-operator">:</div> <div class="code-punctuation">[</div><div class="code-string">"background.js"</div><div class="code-punctuation">]</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-indent"></div><div class="code-punctuation">}</div>
          </div>
          <div class="code-line">
            <div class="code-indent"></div><div class="code-punctuation">]</div>
          </div>
          <div class="code-line">
            <div class="code-punctuation">}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
