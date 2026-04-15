<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import jsLanguage from 'highlight.js/lib/languages/javascript'
import jsonLanguage from 'highlight.js/lib/languages/json'
import { useData } from 'vitepress'
import { onMounted, onUpdated } from 'vue'

// @ts-ignore
import hljsDarkCss from 'highlight.js/styles/github-dark-dimmed.css?raw'
// @ts-ignore
import hljsLightCss from 'highlight.js/styles/github.css?raw'

const { isDark } = useData()

hljs.registerLanguage('json', jsonLanguage)
hljs.registerLanguage('javascript', jsLanguage)
onMounted(() => highlight())
onUpdated(() => highlight())

const highlight = () => {
  for (const pre of document.querySelectorAll('pre')) {
    const lang = pre.getAttribute('data-lang')
    if (!lang) continue
    if (!hljs.getLanguage(lang)) continue
    pre.innerHTML = hljs.highlight(pre.textContent ?? '', { language: lang }).value
  }
}
</script>

<template>
  <ClientOnly>
    <component is="style">
      {{ isDark ? hljsDarkCss : hljsLightCss }}
    </component>
  </ClientOnly>
</template>
