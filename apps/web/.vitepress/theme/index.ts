import DefaultTheme from 'vitepress/theme'
import DocsLanding from './components/DocsLanding.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DocsLanding', DocsLanding)
  },
}
