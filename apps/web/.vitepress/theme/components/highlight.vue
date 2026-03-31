<script setup lang="ts">
import hljs from 'highlight.js'
import jsLanguage from 'highlight.js/lib/languages/javascript'
import jsonLanguage from 'highlight.js/lib/languages/json'
import { useData } from 'vitepress'
import { onMounted, ref, watch } from 'vue'

// @ts-ignore
import hljsDarkCss from 'highlight.js/styles/github-dark-dimmed.css?raw'
// @ts-ignore
import hljsLightCss from 'highlight.js/styles/github.css?raw'

const { isDark } = useData()

onMounted(() => {
  hljs.registerLanguage('js', jsLanguage)
  hljs.registerLanguage('json', jsonLanguage)

  for (const pre of document.querySelectorAll('pre')) {
    const lang = pre.getAttribute('data-lang')
    if (!lang) continue
    pre.innerHTML = hljs.highlight(pre.textContent, { language: lang }).value
  }
})
</script>

<template>
  <component is="style">
    {{ isDark ? hljsDarkCss : hljsLightCss }}
  </component>
</template>
