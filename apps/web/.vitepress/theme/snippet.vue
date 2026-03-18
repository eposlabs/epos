<script setup lang="ts">
defineProps<{
  type: 'bus.on' | 'bus.send' | 'epos.json' | 'state' | 'storage'
}>()
</script>

<style scoped>
@reference './custom.css';
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
</style>

<template>
  <!-- bus.on -->
  <div class="code-block" v-if="type === 'bus.on'">
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

  <!-- bus.send -->
  <div class="code-block" v-if="type === 'bus.send'">
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

  <!-- epos.json -->
  <div class="code-block" v-if="type === 'epos.json'">
    <div class="code">
      <div class="code-label">epos.json</div>
      <div class="code-line">
        <div class="code-punctuation">{</div>
      </div>
      <div class="code-line">
        <div class="code-indent"></div>
        <div class="code-string">"name"</div>
        <div class="code-operator">:</div>
        <div> </div>
        <div class="code-string">"My Extension"</div>
        <div class="code-punctuation">,</div>
      </div>
      <div class="code-line">
        <div class="code-indent"></div>
        <div class="code-string">"targets"</div>
        <div class="code-operator">:</div>
        <div> </div>
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
        <div class="code-string">"matches"</div>
        <div class="code-operator">:</div>
        <div> </div>
        <div class="code-string">"*://*.example.com/*"</div>
        <div class="code-punctuation">,</div>
      </div>
      <div class="code-line">
        <div class="code-indent"></div>
        <div class="code-indent"></div>
        <div class="code-indent"></div>
        <div class="code-string">"load"</div>
        <div class="code-operator">:</div>
        <div> </div>
        <div class="code-punctuation">[</div>
        <div class="code-string">"main.css"</div>
        <div class="code-punctuation">,</div>
        <div> </div>
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
        <div class="code-string">"matches"</div>
        <div class="code-operator">:</div>
        <div> </div>
        <div class="code-string">"&lt;popup&gt;"</div>
        <div class="code-punctuation">,</div>
      </div>
      <div class="code-line">
        <div class="code-indent"></div>
        <div class="code-indent"></div>
        <div class="code-indent"></div>
        <div class="code-string">"load"</div>
        <div class="code-operator">:</div>
        <div> </div>
        <div class="code-punctuation">[</div>
        <div class="code-string">"popup.css"</div>
        <div class="code-punctuation">,</div>
        <div> </div>
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
        <div class="code-string">"matches"</div>
        <div class="code-operator">:</div>
        <div> </div>
        <div class="code-string">"&lt;background&gt;"</div>
        <div class="code-punctuation">,</div>
      </div>
      <div class="code-line">
        <div class="code-indent"></div>
        <div class="code-indent"></div>
        <div class="code-indent"></div>
        <div class="code-string">"load"</div>
        <div class="code-operator">:</div>
        <div> </div>
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
</template>
