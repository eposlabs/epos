<template>
  <!-- Why Epos -->
  <div class="box space-y-4 border-t border-r border-l">
    <div class="eyebrow">WHY EPOS?</div>
    <h2 class="h2">Reimagine extension development</h2>
    <p class="prose max-w-2xl">
      Epos is a browser extension for building other browser extensions. Connect a local folder, describe what should load,
      and start with the hard parts already handled for you.
    </p>
  </div>

  <div class="flex">
    <!-- Messaging -->
    <div class="box w-1/2 border-t border-l">
      <div class="eyebrow">MESSAGING</div>
      <h2 class="h2 mt-4">Unified messaging system</h2>
      <p class="prose mt-4 max-w-2xl">Like <code>chrome.runtime.sendMessage</code>, but 10x more powerful.</p>
      <ul class="prose mt-4 list-disc space-y-3 pl-5 text-zinc-500">
        <li>Simple API</li>
        <li>Automatic routing</li>
        <li>Works across all contexts</li>
      </ul>
      <div class="code-block">
        <div class="code">
          <div class="code-line">
            <div class="code-comment">// Send</div>
          </div>
          <div class="code-line">
            <div class="code-variable">epos</div>
            <div class="code-punctuation">.</div>
            <div class="code-property">bus</div>
            <div class="code-punctuation">.</div>
            <div class="code-function">send</div>
            <div class="code-punctuation">(</div>
            <div class="code-string">'event'</div>
            <div class="code-punctuation">,</div>
            <div class="code-variable">data</div>
            <div class="code-punctuation">)</div>
          </div>
          <div class="code-line"></div>
          <div class="code-line">
            <div class="code-comment">// Listen</div>
          </div>
          <div class="code-line">
            <div class="code-variable">epos</div>
            <div class="code-punctuation">.</div>
            <div class="code-property">bus</div>
            <div class="code-punctuation">.</div>
            <div class="code-function">on</div>
            <div class="code-punctuation">(</div>
            <div class="code-string">'event'</div>
            <div class="code-punctuation">,</div>
            <div class="code-variable">handler</div>
            <div class="code-punctuation">)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- State -->
    <div class="box w-1/2 border-t border-r border-l">
      <div class="eyebrow">SHARED STATE</div>
      <h2 class="h2 mt-4">State that feels like normal object</h2>
      <p class="prose mt-4 max-w-2xl">
        Connect once and work with one shared object across contexts. Read and write state directly with normal objects and
        arrays. Changes sync automatically, so updates in background appear in popup right away. State is persisted and
        restored when the browser opens again.
      </p>
      <div class="code-block">
        <div class="code">
          <div class="code-line">
            <div class="code-comment">// Connect</div>
          </div>
          <div class="code-line">
            <div class="code-keyword">const</div>
            <div class="code-variable">state</div>
            <div class="code-operator">=</div>
            <div class="code-variable">epos</div>
            <div class="code-punctuation">.</div>
            <div class="code-property">state</div>
            <div class="code-punctuation">.</div>
            <div class="code-function">connect</div>
            <div class="code-punctuation">()</div>
          </div>
          <div class="code-line"></div>
          <div class="code-line">
            <div class="code-comment">// Modify</div>
          </div>
          <div class="code-line">
            <div class="code-variable">state</div>
            <div class="code-punctuation">.</div>
            <div class="code-property">user</div>
            <div class="code-operator">=</div>
            <div class="code-punctuation">{</div>
            <div class="code-property">name</div>
            <div class="code-operator">:</div>
            <div class="code-string">'Alex'</div>
            <div class="code-punctuation">}</div>
          </div>
          <div class="code-line">
            <div class="code-variable">state</div>
            <div class="code-punctuation">.</div>
            <div class="code-property">items</div>
            <div class="code-operator">=</div>
            <div class="code-punctuation">[]</div>
          </div>
          <div class="code-line">
            <div class="code-variable">state</div>
            <div class="code-punctuation">.</div>
            <div class="code-property">items</div>
            <div class="code-punctuation">.</div>
            <div class="code-function">push</div>
            <div class="code-punctuation">(</div>
            <div class="code-punctuation">{</div>
            <div class="code-property">id</div>
            <div class="code-operator">:</div>
            <div class="code-number">1</div>
            <div class="code-punctuation">,</div>
            <div class="code-property">name</div>
            <div class="code-operator">:</div>
            <div class="code-string">'Item 1'</div>
            <div class="code-punctuation">}</div>
            <div class="code-punctuation">)</div>
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
          <div class="code-keyword">await</div>
          <div class="code-variable">epos</div>
          <div class="code-punctuation">.</div>
          <div class="code-property">storage</div>
          <div class="code-punctuation">.</div>
          <div class="code-function">set</div>
          <div class="code-punctuation">(</div>
          <div class="code-string">'profile-pic'</div>
          <div class="code-punctuation">,</div>
          <div class="code-variable">imageBlob</div>
          <div class="code-punctuation">)</div>
        </div>
        <div class="code-line"></div>
        <div class="code-line">
          <div class="code-comment">// Load</div>
        </div>
        <div class="code-line">
          <div class="code-keyword">const</div>
          <div class="code-variable">imageBlob</div>
          <div class="code-operator">=</div>
          <div class="code-keyword">await</div>
          <div class="code-variable">epos</div>
          <div class="code-punctuation">.</div>
          <div class="code-property">storage</div>
          <div class="code-punctuation">.</div>
          <div class="code-function">get</div>
          <div class="code-punctuation">(</div>
          <div class="code-string">'profile-pic'</div>
          <div class="code-punctuation">)</div>
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
          <div class="code-keyword">const</div>
          <div class="code-variable">tabs</div>
          <div class="code-operator">=</div>
          <div class="code-keyword">await</div>
          <div class="code-variable">epos</div>
          <div class="code-punctuation">.</div>
          <div class="code-property">browser</div>
          <div class="code-punctuation">.</div>
          <div class="code-property">tabs</div>
          <div class="code-punctuation">.</div>
          <div class="code-function">query</div>
          <div class="code-punctuation">(</div>
          <div class="code-punctuation">{</div>
          <div class="code-property">active</div>
          <div class="code-operator">:</div>
          <div class="code-boolean">true</div>
          <div class="code-punctuation">}</div>
          <div class="code-punctuation">)</div>
        </div>
        <div class="code-line">
          <div class="code-variable">console</div>
          <div class="code-punctuation">.</div>
          <div class="code-function">log</div>
          <div class="code-punctuation">(</div>
          <div class="code-variable">tabs</div>
          <div class="code-punctuation">)</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Simplified Setup -->
  <div class="box border-t border-r border-l">
    <div class="eyebrow">SETUP</div>
    <h2 class="h2 mt-4">Simplified setup for your extensions</h2>
    <p class="prose mt-4 max-w-2xl">
      Just tell Epos what fliles to load and where and Epos already knows how to inject scripts, isolate styles, and handle
      all hard setup for your application to work cross-context.
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
          <div class="code-indent"></div>
          <div class="code-string">"name"</div>
          <div class="code-operator">:</div>
          <div class="code-string">"My Extension"</div>
          <div class="code-punctuation">,</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-string">"targets"</div>
          <div class="code-operator">:</div>
          <div class="code-punctuation">[</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-punctuation">{</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-string">"match"</div>
          <div class="code-operator">:</div>
          <div class="code-punctuation">[</div>
          <div class="code-string">"*://*.example.com/*"</div>
          <div class="code-punctuation">],</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-string">"scripts"</div>
          <div class="code-operator">:</div>
          <div class="code-punctuation">[</div>
          <div class="code-string">"main.css"</div>
          <div class="code-punctuation">,</div>
          <div class="code-string">"main.js"</div>
          <div class="code-punctuation">]</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-punctuation">},</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-punctuation">{</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-string">"match"</div>
          <div class="code-operator">:</div>
          <div class="code-punctuation">[</div>
          <div class="code-string">"&lt;popup&gt;"</div>
          <div class="code-punctuation">],</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-string">"scripts"</div>
          <div class="code-operator">:</div>
          <div class="code-punctuation">[</div>
          <div class="code-string">"popup.css"</div>
          <div class="code-punctuation">,</div>
          <div class="code-string">"popup.js"</div>
          <div class="code-punctuation">]</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-punctuation">},</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-punctuation">{</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-string">"match"</div>
          <div class="code-operator">:</div>
          <div class="code-punctuation">[</div>
          <div class="code-string">"&lt;background&gt;"</div>
          <div class="code-punctuation">],</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-string">"scripts"</div>
          <div class="code-operator">:</div>
          <div class="code-punctuation">[</div>
          <div class="code-string">"background.js"</div>
          <div class="code-punctuation">]</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-indent"></div>
          <div class="code-punctuation">}</div>
        </div>
        <div class="code-line">
          <div class="code-indent"></div>
          <div class="code-punctuation">]</div>
        </div>
        <div class="code-line">
          <div class="code-punctuation">}</div>
        </div>
      </div>
    </div>
  </div>
</template>



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


.OVERRIDES {
  .docs-landing-shell {
    margin-inline: calc(50% - 50vw);
    width: 100vw;
  }

  .docs-section {
    @apply mx-auto max-w-7xl px-6 sm:px-8 lg:px-12;
  }

  .VPContent:not(:has(.has-sidebar)) {
    @apply pt-0;
  }

  .VPNav:not(:has(.has-sidebar)) {
    @apply relative overflow-hidden pb-px;
  }

  .VPNavBar:not(.has-sidebar) {
    @apply mx-auto max-w-7xl border-r border-l border-zinc-200;
  }

  --vp-c-gutter: var(--vp-c-divider);
  --vp-sidebar-bg-color: var(--vp-c-bg);

  &.dark {
    --color-accent: var(--color-brand);
    --vp-c-bg: #16171d;
    --vp-c-divider: #202333;
  }

  .VPNavBarTitle.has-sidebar .title {
    @apply border-b-transparent;
  }

  .VPSidebar {
    @apply mt-16 border-r border-(--vp-c-divider) pt-4.5 shadow-none;
  }

  .VPNavBar.has-sidebar .divider {
    @apply pl-0;
  }

  .VPDoc .aside-container {
    @apply border-l border-(--vp-c-divider);
  }

  .VPDocAside .content {
    @apply border-l-0 pl-8;
  }
  .VPDocAside .outline-marker {
    @apply w-0.75 rounded-none;
  }

  .aside-container {
    padding-top: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + var(--vp-doc-top-height, 0px) + 28px);
  }

  .VPFeatures .item {
    @apply p-0;
  }
  .VPFeature {
    @apply rounded-none border-(--vp-c-divider) bg-(--vp-c-bg);
  }
  .VPFeatures .item:nth-child(1) .VPFeature {
    @apply border-r-0 border-b-0;
  }
  .VPFeatures .item:nth-child(2) .VPFeature {
    @apply border-r-0 border-b-0;
  }
  .VPFeatures .item:nth-child(3) .VPFeature {
    @apply border-b-0;
  }
  .VPFeatures .item:nth-child(4) .VPFeature {
    @apply border-r-0;
  }
  .VPFeatures .item:nth-child(5) .VPFeature {
    @apply border-r-0;
  }

  .vp-code-group .tabs label:first-of-type:last-child {
    &::after {
      @apply bg-black;
    }
    .dark &::after {
      @apply bg-white/50;
    }
  }

  .vp-code-group .tabs {
    .dark & {
      @apply bg-[#121317];
    }
  }

  pre.shiki {
    .dark & {
      @apply bg-[#121317];
    }
  }
}
